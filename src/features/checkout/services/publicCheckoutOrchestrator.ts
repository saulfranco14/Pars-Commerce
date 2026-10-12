import { resolveUserError } from "@/lib/errors/resolveUserError";
import { createAdminClient } from "@/lib/supabase/admin";
import { DEFAULT_RECURRING_CONFIG } from "@/types/subscriptions";
import { NextResponse } from "next/server";

import {
  calcCartSubtotal,
  type CartItemRow,
} from "@/features/checkout/helpers/cartItemMappers";
import {
  getFingerprint,
  getOrigin,
  parseBody,
  toMode,
} from "@/features/checkout/helpers/checkoutRequest";
import type { CheckoutContext } from "@/features/checkout/helpers/checkoutContext";
import { ensureCustomer } from "@/features/checkout/helpers/ensureCustomer";
import {
  readPickupScheduling,
  validateScheduledFor,
} from "@/features/checkout/helpers/pickupSchedule";
import { readBusinessHours } from "@/features/configuracion/helpers/businessHours";
import { createOrderItems } from "@/features/checkout/helpers/orderItems";
import { validateOrderStock } from "@/features/inventory/services/orderStockValidationService";
import type {
  CheckoutMode,
  CheckoutFulfillmentMethod,
  CheckoutPaymentMethod,
  PublicCheckoutResponse,
} from "@/features/checkout/interfaces/publicCheckout";
import { handlePartialCheckout } from "@/features/checkout/services/partialCheckoutHandler";
import { handleSingleCheckout } from "@/features/checkout/services/singleCheckoutHandler";
import { handleMerchantSingleCheckout } from "@/features/checkout/services/merchantSingleCheckoutHandler";
import { asPaymentProviderAdmin } from "@/features/payment-providers/connectionService";
import { handleSubscriptionCheckout } from "@/features/checkout/services/subscriptionCheckoutHandler";

import type { RecurringPurchasesConfig } from "@/types/subscriptions";

interface ExecuteCheckoutParams {
  request: Request;
  modeOverride?: CheckoutMode;
}

const ATTEMPT_TTL_MS = 60 * 60 * 1000;
type CommerceAdmin = { from: (table: string) => any };

export async function executePublicCheckout({
  request,
  modeOverride,
}: ExecuteCheckoutParams): Promise<
  NextResponse<PublicCheckoutResponse | { error: string }>
> {
  const fingerprint = getFingerprint(request);
  if (!fingerprint) {
    return NextResponse.json(
      { error: "x-fingerprint-id header is required" },
      { status: 400 },
    );
  }

  let rawBody: unknown;
  try {
    rawBody = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const payload = parseBody(rawBody);
  if (!payload) {
    return NextResponse.json(
      {
        error:
          "tenant_id, cart_id, customer_name and customer_email are required",
      },
      { status: 400 },
    );
  }

  const mode = toMode(payload.mode, modeOverride);
  const admin = createAdminClient();
  const providerAdmin = asPaymentProviderAdmin(admin);

  const { data: tenant } = await providerAdmin
    .from("tenants")
    .select("id, slug, settings, accepting_orders, merchant_payments_v2_enabled")
    .eq("id", payload.tenant_id)
    .eq("public_store_enabled", true)
    .single();

  if (!tenant) {
    return NextResponse.json(
      { error: "Tenant not found or public store disabled" },
      { status: 404 },
    );
  }

  // El negocio cerró la recepción. El catálogo sigue en pie —el sitio lo
  // muestra con un aviso—, pero aquí no se cobra nada. 409 y no 403: no es
  // falta de permiso, es que ahora mismo no se puede.
  if (tenant.accepting_orders === false) {
    return NextResponse.json(
      {
        error:
          "Este negocio no está recibiendo pedidos en este momento. Vuelve más tarde.",
      },
      { status: 409 },
    );
  }

  const tenantSettings =
    (tenant.settings as Record<string, unknown> | null) ?? {};

  const commerceAdmin = admin as unknown as CommerceAdmin;
  const fulfillmentMethod: CheckoutFulfillmentMethod = payload.fulfillment_method ?? "pickup";
  const paymentMethod: CheckoutPaymentMethod = payload.payment_method ?? "mercadopago";
  if (paymentMethod !== "mercadopago" && mode !== "single") {
    return NextResponse.json({ error: "Transferencia y efectivo sólo están disponibles para pago único." }, { status: 400 });
  }
  const [{ data: fulfillment }, { data: paymentMethods }] = await Promise.all([
    commerceAdmin.from("tenant_fulfillment_settings").select("delivery_enabled, delivery_fee, delivery_area_label, pickup_enabled, online_payment_enabled").eq("tenant_id", payload.tenant_id).maybeSingle(),
    commerceAdmin.from("tenant_payment_methods").select("id, kind, is_active").eq("tenant_id", payload.tenant_id).eq("is_active", true),
  ]);
  const config = fulfillment as { delivery_enabled?: boolean; delivery_fee?: number | string; pickup_enabled?: boolean; online_payment_enabled?: boolean } | null;
  const paymentOptions = (paymentMethods ?? []) as { id: string; kind: "bank_transfer" | "cash"; is_active: boolean }[];
  const transferMethod = paymentOptions.find((item) => item.kind === "bank_transfer");
  const cashMethod = paymentOptions.find((item) => item.kind === "cash");
  if (fulfillmentMethod === "delivery") {
    if (!config?.delivery_enabled) return NextResponse.json({ error: "Este negocio no tiene entrega a domicilio activa." }, { status: 409 });
    const delivery = payload.delivery;
    if (!delivery?.recipient_name?.trim() || !delivery.phone?.trim() || !delivery.address_text?.trim()) {
      return NextResponse.json({ error: "Completa quién recibe, teléfono y dirección de entrega." }, { status: 400 });
    }
  } else if (!config?.pickup_enabled) {
    return NextResponse.json({ error: "Este negocio no tiene recolección activa." }, { status: 409 });
  }
  let selectedPickupPoint: { id: string; business_hours?: unknown } | null = null;
  if (fulfillmentMethod === "pickup") {
    if (!payload.pickup_point_id) {
      return NextResponse.json({ error: "Elige un punto de recolección." }, { status: 400 });
    }
    const { data: pickupPoint } = await commerceAdmin
      .from("tenant_pickup_points")
      .select("id, business_hours")
      .eq("id", payload.pickup_point_id)
      .eq("tenant_id", payload.tenant_id)
      .eq("is_active", true)
      .maybeSingle();
    selectedPickupPoint = pickupPoint as { id: string; business_hours?: unknown } | null;
    if (!selectedPickupPoint) {
      return NextResponse.json({ error: "Ese punto de recolección ya no está disponible. Elige otro." }, { status: 409 });
    }
  }
  if (paymentMethod === "bank_transfer" && !transferMethod) return NextResponse.json({ error: "La transferencia no está disponible para este negocio." }, { status: 409 });
  if (paymentMethod === "cash" && (fulfillmentMethod !== "pickup" || !cashMethod)) return NextResponse.json({ error: "El efectivo sólo está disponible al recoger y cuando el negocio lo habilita." }, { status: 409 });
  if (paymentMethod === "mercadopago" && !config?.online_payment_enabled) return NextResponse.json({ error: "El pago en línea no está disponible para este negocio." }, { status: 409 });

  const scheduling = readPickupScheduling(tenantSettings);
  const pickupHours = selectedPickupPoint?.business_hours
    ? readBusinessHours({ business_hours: selectedPickupPoint.business_hours })
    : readBusinessHours(tenantSettings);
  const schedule = fulfillmentMethod === "pickup"
    ? validateScheduledFor(payload.scheduled_for, scheduling, new Date(), pickupHours)
    : { ok: true as const, value: null };
  if (!schedule.ok) return NextResponse.json({ error: schedule.message }, { status: 400 });
  const scheduledFor = schedule.value;
  const recurringConfig: RecurringPurchasesConfig = {
    ...DEFAULT_RECURRING_CONFIG,
    ...((tenantSettings.recurring_purchases as Partial<RecurringPurchasesConfig>) ??
      {}),
  };

  const { data: cart } = await admin
    .from("public_carts")
    .select("id")
    .eq("id", payload.cart_id)
    .eq("tenant_id", payload.tenant_id)
    .eq("fingerprint_id", fingerprint)
    .single();

  if (!cart) {
    return NextResponse.json({ error: "Cart not found" }, { status: 404 });
  }

  const { data: cartItems } = await admin
    .from("public_cart_items")
    .select(
      "product_id, product_variant_id, quantity, price_snapshot, promotion_id, product:products(id, name, image_url)",
    )
    .eq("cart_id", payload.cart_id);

  if (!cartItems || cartItems.length === 0) {
    return NextResponse.json({ error: "Cart is empty" }, { status: 400 });
  }

  const normalizedItems = cartItems as CartItemRow[];
  const cartSubtotal = calcCartSubtotal(normalizedItems);
  const deliveryFee = fulfillmentMethod === "delivery" ? Number(config?.delivery_fee ?? 0) : 0;
  const subtotal = cartSubtotal + deliveryFee;

  const customerId = await ensureCustomer(
    admin,
    payload.tenant_id,
    payload.customer_name,
    payload.customer_email,
    payload.customer_phone,
  );

  const orderStatus = paymentMethod === "cash"
    ? "pending_acceptance"
    : mode === "subscription" ? "pending_subscription" : "pending_payment";
  const paymentPlanStatus =
    mode === "subscription"
      ? "pending"
      : mode === "partial"
        ? "active"
        : "none";

  const installments =
    payload.installments && payload.installments > 1 ? payload.installments : 0;
  const frequency =
    payload.frequency && payload.frequency > 0 ? payload.frequency : 1;
  const frequencyType = payload.frequency_type ?? "months";
  const expiresAt = new Date(Date.now() + ATTEMPT_TTL_MS).toISOString();

  const stockValidation = await validateOrderStock(
    admin,
    payload.tenant_id,
    normalizedItems,
  );
  if (!stockValidation.ok) {
    return NextResponse.json({ error: stockValidation.message }, { status: 409 });
  }

  const { data: order, error: orderError } = await commerceAdmin
    .from("orders")
    .insert({
      tenant_id: payload.tenant_id,
      status: orderStatus,
      subtotal: cartSubtotal,
      discount: 0,
      total: subtotal,
      source: "public_store",
      customer_id: customerId,
      customer_name: payload.customer_name.trim(),
      customer_email: payload.customer_email.trim().toLowerCase(),
      customer_phone: payload.customer_phone?.trim() || null,
      payment_mode: mode,
      payment_method: paymentMethod,
      fulfillment_method: fulfillmentMethod,
      delivery_fee: deliveryFee,
      transfer_payment_method_id: paymentMethod === "bank_transfer" ? transferMethod?.id ?? null : null,
      payment_verification_status: paymentMethod === "bank_transfer" ? "proof_required" : "not_required",
      payment_plan_status: paymentPlanStatus,
      paid_total: 0,
      balance_due: subtotal,
      expires_at: expiresAt,
      scheduled_for: scheduledFor?.toISOString() ?? null,
      order_type: fulfillmentMethod === "delivery" ? "delivery" : "takeaway",
      work_metadata: {
        checkout_mode: mode,
        public_cart_id: payload.cart_id,
      },
    })
    .select("id, checkout_session_id, public_tracking_token")
    .single();

  if (orderError || !order) {
    return NextResponse.json(
      { error: orderError?.message ?? "Error creating order" },
      { status: 500 },
    );
  }

  try {
    await createOrderItems(admin, order.id, normalizedItems);
  } catch (err) {
    return NextResponse.json(
      { error: resolveUserError(err, "supabase") },
      { status: 500 },
    );
  }

  if (fulfillmentMethod === "delivery" && payload.delivery) {
    const delivery = payload.delivery;
    const latitude = Number(delivery.latitude);
    const longitude = Number(delivery.longitude);
    const { error: deliveryError } = await commerceAdmin.from("order_delivery_details").insert({
      order_id: order.id,
      recipient_name: delivery.recipient_name.trim(),
      recipient_phone: delivery.phone.trim(),
      address_text: delivery.address_text.trim(),
      reference: delivery.reference?.trim() || null,
      latitude: Number.isFinite(latitude) ? latitude : null,
      longitude: Number.isFinite(longitude) ? longitude : null,
      mapbox_feature_id: delivery.mapbox_feature_id?.trim() || null,
    });
    if (deliveryError) return NextResponse.json({ error: deliveryError.message }, { status: 500 });
  } else if (payload.pickup_point_id) {
    const { error: pickupError } = await commerceAdmin.from("order_delivery_details").insert({ order_id: order.id, pickup_point_id: payload.pickup_point_id });
    if (pickupError) return NextResponse.json({ error: pickupError.message }, { status: 500 });
  }

  if (paymentMethod === "bank_transfer" || paymentMethod === "cash") {
    // La orden ya nació y tiene su enlace privado de seguimiento. Vaciar el
    // carrito aquí evita que una transferencia o un pago al recoger vuelva a
    // crear la misma orden si la persona visita otra tienda o cierra el sitio.
    // Mercado Pago se conserva hasta su webhook de pago exitoso, por si el
    // cliente abandona o cancela el checkout externo.
    await commerceAdmin
      .from("public_cart_items")
      .delete()
      .eq("cart_id", payload.cart_id);
    return NextResponse.json({
      success: true,
      checkout_mode: mode,
      status: "pending",
      order_id: order.id,
      tracking_url: `/pedido/${order.public_tracking_token}`,
      next_action: "open_tracking",
    });
  }

  const idempotencyKey =
    request.headers.get("x-idempotency-key")?.trim() ??
    `checkout:${order.id}:${mode}:${Date.now()}`;

  const ctx: CheckoutContext = {
    admin,
    payload,
    tenantSlug: tenant.slug ?? "",
    recurringConfig,
    cartItems: normalizedItems,
    deliveryFee,
    subtotal,
    customerId,
    order,
    origin: getOrigin(request),
    idempotencyKey,
    expiresAt,
    installments,
    frequency,
    frequencyType,
    merchantPaymentsEnabled: tenant.merchant_payments_v2_enabled === true,
  };

  if (mode === "single") {
    return ctx.merchantPaymentsEnabled
      ? handleMerchantSingleCheckout(ctx)
      : handleSingleCheckout(ctx);
  }
  if (ctx.merchantPaymentsEnabled) {
    return NextResponse.json(
      { error: "Este negocio aún está activando pagos a plazos y suscripciones con su propia cuenta. Elige pago único o consulta al negocio." },
      { status: 409 },
    );
  }
  if (mode === "partial") return handlePartialCheckout(ctx);
  return handleSubscriptionCheckout(ctx);
}
