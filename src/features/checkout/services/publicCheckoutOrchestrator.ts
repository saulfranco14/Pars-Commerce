import { calcBuyerTotal, calcSubscriptionFees, TARIFA_DE_SERVICIO_LABEL } from "@/constants/commissionConfig";
import { resolveUserError } from "@/lib/errors/resolveUserError";
import { preferenceClient } from "@/lib/mercadopago";
import { createAdminClient } from "@/lib/supabase/admin";
import { DEFAULT_RECURRING_CONFIG } from "@/types/subscriptions";
import { MercadoPagoConfig, PreApproval } from "mercadopago";
import { NextResponse } from "next/server";

import type { CheckoutMode, PublicCheckoutPayload, PublicCheckoutResponse } from "@/features/checkout/interfaces/publicCheckout";
import type { RecurringPurchasesConfig, SubscriptionItemSnapshot } from "@/types/subscriptions";

const FINGERPRINT_HEADER = "x-fingerprint-id";
const APP_URL = process.env.NEXT_PUBLIC_APP_URL ?? "https://commerce.pars.com.mx";

interface ExecuteCheckoutParams {
  request: Request;
  modeOverride?: CheckoutMode;
}

type CartItemRow = {
  product_id: string;
  quantity: number;
  price_snapshot: number;
  promotion_id?: string | null;
  product:
    | {
        id: string;
        name: string;
        image_url: string | null;
      }
    | Array<{
        id: string;
        name: string;
        image_url: string | null;
      }>;
};

function getFingerprint(request: Request): string | null {
  return request.headers.get(FINGERPRINT_HEADER)?.trim() || null;
}

function parseBody(raw: unknown): PublicCheckoutPayload | null {
  if (!raw || typeof raw !== "object") return null;
  const body = raw as Partial<PublicCheckoutPayload>;
  if (!body.tenant_id || !body.cart_id || !body.customer_name || !body.customer_email) return null;
  return {
    tenant_id: body.tenant_id,
    cart_id: body.cart_id,
    customer_name: body.customer_name,
    customer_email: body.customer_email,
    customer_phone: body.customer_phone,
    mode: body.mode ?? "single",
    installments: body.installments,
    frequency: body.frequency,
    frequency_type: body.frequency_type,
  };
}

function getOrigin(request: Request): string {
  const rawOrigin =
    request.headers.get("origin") ??
    request.headers.get("referer")?.replace(/\/[^/]*$/, "") ??
    "http://localhost:3000";
  const isLocalhost =
    rawOrigin.includes("localhost") || rawOrigin.includes("127.0.0.1");
  return isLocalhost ? APP_URL : rawOrigin;
}

function toMode(mode: string | undefined, modeOverride?: CheckoutMode): CheckoutMode {
  if (modeOverride) return modeOverride;
  if (mode === "subscription" || mode === "partial" || mode === "single") return mode;
  return "single";
}

function frequencyToDate(baseDate: Date, step: number, type: "weeks" | "months"): Date {
  const next = new Date(baseDate);
  if (type === "weeks") {
    next.setDate(next.getDate() + step * 7);
    return next;
  }
  next.setMonth(next.getMonth() + step);
  return next;
}

async function ensureCustomer(
  admin: ReturnType<typeof createAdminClient>,
  tenantId: string,
  customerName: string,
  customerEmail: string,
  customerPhone?: string,
): Promise<string | null> {
  const normalizedEmail = customerEmail.trim().toLowerCase();
  const { data: existing } = await admin
    .from("customers")
    .select("id")
    .eq("tenant_id", tenantId)
    .eq("email", normalizedEmail)
    .single();

  if (existing?.id) return existing.id;

  const { data: created } = await admin
    .from("customers")
    .insert({
      tenant_id: tenantId,
      name: customerName.trim(),
      email: normalizedEmail,
      phone: customerPhone?.trim() || null,
    })
    .select("id")
    .single();

  return created?.id ?? null;
}

function mapCartItemProduct(item: CartItemRow): { id: string; name: string; image_url: string | null } {
  const product = Array.isArray(item.product) ? item.product[0] : item.product;
  return {
    id: product?.id ?? item.product_id,
    name: product?.name ?? "Producto",
    image_url: product?.image_url ?? null,
  };
}

async function createPaymentAttempt(
  admin: ReturnType<typeof createAdminClient>,
  input: {
    order_id: string;
    tenant_id: string;
    mode: CheckoutMode;
    amount: number;
    idempotency_key: string;
    expires_at: string;
    metadata?: Record<string, unknown>;
  },
) {
  const { data: existing } = await admin
    .from("order_payment_attempts")
    .select("id, external_reference, provider_reference")
    .eq("idempotency_key", input.idempotency_key)
    .single();

  if (existing) return existing;

  const { data, error } = await admin
    .from("order_payment_attempts")
    .insert({
      order_id: input.order_id,
      tenant_id: input.tenant_id,
      mode: input.mode,
      amount: input.amount,
      idempotency_key: input.idempotency_key,
      status: "created",
      expires_at: input.expires_at,
      metadata: input.metadata ?? {},
    })
    .select("id, external_reference, provider_reference")
    .single();

  if (error || !data) {
    throw new Error(error?.message ?? "No se pudo crear intento de pago");
  }

  return data;
}

async function createOrderItems(
  admin: ReturnType<typeof createAdminClient>,
  orderId: string,
  cartItems: CartItemRow[],
) {
  const rows = cartItems.map((item) => {
    const unitPrice = Number(item.price_snapshot);
    const subtotal = unitPrice * item.quantity;
    return {
      order_id: orderId,
      product_id: item.product_id,
      quantity: item.quantity,
      unit_price: unitPrice,
      subtotal,
      promotion_id: item.promotion_id ?? null,
    };
  });

  const { error } = await admin.from("order_items").insert(rows);
  if (error) throw new Error(error.message);
}

export async function executePublicCheckout({
  request,
  modeOverride,
}: ExecuteCheckoutParams): Promise<NextResponse<PublicCheckoutResponse | { error: string }>> {
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
      { error: "tenant_id, cart_id, customer_name and customer_email are required" },
      { status: 400 },
    );
  }

  const mode = toMode(payload.mode, modeOverride);
  const admin = createAdminClient();

  const { data: tenant } = await admin
    .from("tenants")
    .select("id, slug, settings")
    .eq("id", payload.tenant_id)
    .eq("public_store_enabled", true)
    .single();

  if (!tenant) {
    return NextResponse.json(
      { error: "Tenant not found or public store disabled" },
      { status: 404 },
    );
  }

  const tenantSettings = (tenant.settings as Record<string, unknown> | null) ?? {};
  const recurringConfig: RecurringPurchasesConfig = {
    ...DEFAULT_RECURRING_CONFIG,
    ...((tenantSettings.recurring_purchases as Partial<RecurringPurchasesConfig>) ?? {}),
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
    .select("product_id, quantity, price_snapshot, promotion_id, product:products(id, name, image_url)")
    .eq("cart_id", payload.cart_id);

  if (!cartItems || cartItems.length === 0) {
    return NextResponse.json({ error: "Cart is empty" }, { status: 400 });
  }

  const normalizedItems = cartItems as CartItemRow[];
  const subtotal = normalizedItems.reduce(
    (sum, item) => sum + Number(item.price_snapshot) * item.quantity,
    0,
  );

  const customerId = await ensureCustomer(
    admin,
    payload.tenant_id,
    payload.customer_name,
    payload.customer_email,
    payload.customer_phone,
  );

  const orderStatus =
    mode === "subscription"
      ? "pending_subscription"
      : "pending_payment";
  const paymentPlanStatus =
    mode === "subscription"
      ? "pending"
      : mode === "partial"
        ? "active"
        : "none";

  const installments = payload.installments && payload.installments > 1 ? payload.installments : 0;
  const frequency = payload.frequency && payload.frequency > 0 ? payload.frequency : 1;
  const frequencyType = payload.frequency_type ?? "months";

  const expiresAt = new Date(Date.now() + 60 * 60 * 1000).toISOString();

  const { data: order, error: orderError } = await admin
    .from("orders")
    .insert({
      tenant_id: payload.tenant_id,
      status: orderStatus,
      subtotal,
      discount: 0,
      total: subtotal,
      source: "public_store",
      customer_id: customerId,
      customer_name: payload.customer_name.trim(),
      customer_email: payload.customer_email.trim().toLowerCase(),
      customer_phone: payload.customer_phone?.trim() || null,
      payment_mode: mode,
      payment_plan_status: paymentPlanStatus,
      paid_total: 0,
      balance_due: subtotal,
      expires_at: expiresAt,
      work_metadata: {
        checkout_mode: mode,
        public_cart_id: payload.cart_id,
      },
    })
    .select("id, checkout_session_id")
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

  const origin = getOrigin(request);
  const tenantSlug = tenant.slug ?? "";
  const idempotencyKey =
    request.headers.get("x-idempotency-key")?.trim() ??
    `checkout:${order.id}:${mode}:${Date.now()}`;

  if (mode === "single") {
    const { total: buyerTotal, mpFee, parsFee } = calcBuyerTotal(subtotal);
    const mpFeeRounded = Math.round(mpFee * 100) / 100;
    const parsFeeRounded = Math.round(parsFee * 100) / 100;

    const baseItems = normalizedItems.map((item) => {
      const product = mapCartItemProduct(item);
      return {
        id: product.id,
        title: product.name,
        quantity: item.quantity,
        unit_price: Number(item.price_snapshot),
        currency_id: "MXN" as const,
      };
    });

    const mpItems = [
      ...baseItems,
      ...(mpFeeRounded > 0
        ? [
            {
              id: "mp-fee",
              title: "Comisión Mercado Pago",
              quantity: 1,
              unit_price: mpFeeRounded,
              currency_id: "MXN" as const,
            },
          ]
        : []),
      {
        id: "pars-fee",
        title: TARIFA_DE_SERVICIO_LABEL,
        quantity: 1,
        unit_price: parsFeeRounded,
        currency_id: "MXN" as const,
      },
    ];

    const attempt = await createPaymentAttempt(admin, {
      order_id: order.id,
      tenant_id: payload.tenant_id,
      mode,
      amount: subtotal,
      idempotency_key: idempotencyKey,
      expires_at: expiresAt,
      metadata: {
        checkout_session_id: order.checkout_session_id,
      },
    });

    const externalReference = `order:${order.id}:mode:${mode}:attempt:${attempt.id}`;
    await admin
      .from("order_payment_attempts")
      .update({ external_reference: externalReference })
      .eq("id", attempt.id);

    let preference;
    try {
      preference = await preferenceClient.create({
        body: {
          items: mpItems,
          external_reference: externalReference,
          back_urls: {
            success: `${origin}/sitio/${tenantSlug}/confirmacion?status=success&order_id=${order.id}&mode=single`,
            failure: `${origin}/sitio/${tenantSlug}/confirmacion?status=failure&order_id=${order.id}&mode=single`,
            pending: `${origin}/sitio/${tenantSlug}/confirmacion?status=pending&order_id=${order.id}&mode=single`,
          },
          auto_return: "approved",
          notification_url: `${origin}/api/mercadopago/webhook`,
          payer: { email: payload.customer_email.trim() },
          payment_methods: {
            installments: 12,
          },
        },
      });
    } catch (err) {
      return NextResponse.json(
        { error: resolveUserError(err, "mercadopago") },
        { status: 500 },
      );
    }

    const paymentLink = preference.init_point ?? preference.sandbox_init_point;
    if (!paymentLink) {
      return NextResponse.json(
        { error: "MercadoPago no devolvió link de pago" },
        { status: 502 },
      );
    }

    await admin
      .from("orders")
      .update({
        payment_link: paymentLink,
        mp_preference_id: preference.id,
        payment_method: "mercadopago",
        updated_at: new Date().toISOString(),
      })
      .eq("id", order.id);

    await admin
      .from("order_payment_attempts")
      .update({
        provider_reference: preference.id,
        status: "redirected",
        updated_at: new Date().toISOString(),
      })
      .eq("id", attempt.id);

    await admin.from("payments").insert({
      order_id: order.id,
      provider: "mercadopago",
      external_id: preference.id,
      status: "pending",
      amount: subtotal,
      payment_kind: "single",
      checkout_session_id: order.checkout_session_id,
      attempt_id: attempt.id,
      idempotency_key: `payment:${attempt.id}`,
      metadata: {
        preference_id: preference.id,
        init_point: paymentLink,
        buyer_total: buyerTotal,
      },
    });

    return NextResponse.json({
      success: true,
      checkout_mode: "single",
      status: "redirect",
      order_id: order.id,
      payment_link: paymentLink,
      redirect_url: paymentLink,
      next_action: "open_payment_link",
    });
  }

  if (mode === "partial") {
    const partialInstallments = installments >= 2 ? installments : 3;
    const installmentBase =
      Math.round((subtotal / partialInstallments) * 100) / 100;
    if (installmentBase < 15) {
      return NextResponse.json(
        { error: "El monto por abono debe ser al menos $15 MXN" },
        { status: 400 },
      );
    }

    const fees = calcSubscriptionFees(
      installmentBase,
      recurringConfig.fee_absorbed_by,
    );
    const firstCharge = fees.chargeAmount;

    const now = new Date();
    const scheduleRows = Array.from({ length: partialInstallments }).map(
      (_, idx) => {
        const installmentNumber = idx + 1;
        const dueDate = frequencyToDate(now, idx * frequency, frequencyType);
        const amountDue =
          installmentNumber === partialInstallments
            ? Math.round((subtotal - installmentBase * (partialInstallments - 1)) * 100) / 100
            : installmentBase;
        return {
          order_id: order.id,
          tenant_id: payload.tenant_id,
          installment_number: installmentNumber,
          due_date: dueDate.toISOString(),
          amount_due: amountDue,
          amount_paid: 0,
          status: "pending",
          metadata: {
            mode: "partial",
          },
        };
      },
    );

    const { data: createdSchedules, error: scheduleError } = await admin
      .from("order_payment_schedules")
      .insert(scheduleRows)
      .select("id, installment_number, amount_due")
      .order("installment_number", { ascending: true });

    if (scheduleError || !createdSchedules || createdSchedules.length === 0) {
      return NextResponse.json(
        { error: scheduleError?.message ?? "No se pudo crear el plan de abonos" },
        { status: 500 },
      );
    }

    const firstSchedule = createdSchedules[0] as {
      id: string;
      installment_number: number;
      amount_due: number;
    };

    const attempt = await createPaymentAttempt(admin, {
      order_id: order.id,
      tenant_id: payload.tenant_id,
      mode,
      amount: Number(firstSchedule.amount_due),
      idempotency_key: idempotencyKey,
      expires_at: expiresAt,
      metadata: {
        checkout_session_id: order.checkout_session_id,
        installment_number: firstSchedule.installment_number,
        schedule_id: firstSchedule.id,
      },
    });

    const externalReference = `order:${order.id}:mode:${mode}:attempt:${attempt.id}`;
    await admin
      .from("order_payment_attempts")
      .update({ external_reference: externalReference })
      .eq("id", attempt.id);

    const title = `Abono 1/${partialInstallments} - Pedido ${order.id.slice(0, 8).toUpperCase()}`;
    let preference;
    try {
      preference = await preferenceClient.create({
        body: {
          items: [
            {
              id: `partial-${order.id}`,
              title,
              quantity: 1,
              unit_price: firstCharge,
              currency_id: "MXN",
            },
          ],
          external_reference: externalReference,
          back_urls: {
            success: `${origin}/sitio/${tenantSlug}/confirmacion?status=success&order_id=${order.id}&mode=partial`,
            failure: `${origin}/sitio/${tenantSlug}/confirmacion?status=failure&order_id=${order.id}&mode=partial`,
            pending: `${origin}/sitio/${tenantSlug}/confirmacion?status=pending&order_id=${order.id}&mode=partial`,
          },
          auto_return: "approved",
          notification_url: `${origin}/api/mercadopago/webhook`,
          payer: { email: payload.customer_email.trim() },
          payment_methods: {
            installments: 1,
          },
        },
      });
    } catch (err) {
      return NextResponse.json(
        { error: resolveUserError(err, "mercadopago") },
        { status: 500 },
      );
    }

    const paymentLink = preference.init_point ?? preference.sandbox_init_point;
    if (!paymentLink) {
      return NextResponse.json(
        { error: "MercadoPago no devolvió link de pago" },
        { status: 502 },
      );
    }

    await admin
      .from("orders")
      .update({
        payment_link: paymentLink,
        mp_preference_id: preference.id,
        payment_method: "mercadopago",
        payment_plan_status: "active",
        updated_at: new Date().toISOString(),
      })
      .eq("id", order.id);

    await admin
      .from("order_payment_attempts")
      .update({
        provider_reference: preference.id,
        status: "redirected",
        updated_at: new Date().toISOString(),
      })
      .eq("id", attempt.id);

    await admin.from("payments").insert({
      order_id: order.id,
      provider: "mercadopago",
      external_id: preference.id,
      status: "pending",
      amount: Number(firstSchedule.amount_due),
      payment_kind: "partial",
      installment_number: firstSchedule.installment_number,
      checkout_session_id: order.checkout_session_id,
      attempt_id: attempt.id,
      idempotency_key: `payment:${attempt.id}`,
      metadata: {
        preference_id: preference.id,
        init_point: paymentLink,
        schedule_id: firstSchedule.id,
        charge_amount: firstCharge,
      },
    });

    return NextResponse.json({
      success: true,
      checkout_mode: "partial",
      status: "redirect",
      order_id: order.id,
      payment_link: paymentLink,
      redirect_url: paymentLink,
      next_action: "open_payment_link",
    });
  }

  if (!recurringConfig.recurring_enabled) {
    return NextResponse.json(
      { error: "Compra recurrente no está habilitada para esta tienda" },
      { status: 400 },
    );
  }

  const discountPercent = recurringConfig.subscription_discount_percent;
  const discountedAmount =
    Math.round(subtotal * (1 - discountPercent / 100) * 100) / 100;
  const feeCalc = calcSubscriptionFees(
    discountedAmount,
    recurringConfig.fee_absorbed_by,
  );
  const serviceFee = Math.round((feeCalc.chargeAmount - discountedAmount) * 100) / 100;

  const itemsSnapshot: SubscriptionItemSnapshot[] = normalizedItems.map((item) => {
    const product = mapCartItemProduct(item);
    return {
      product_id: item.product_id,
      name: product.name,
      quantity: item.quantity,
      unit_price: Number(item.price_snapshot),
      image_url: product.image_url,
      promotion_id: item.promotion_id ?? null,
    };
  });

  const concept = itemsSnapshot.map((item) => item.name).join(", ");
  const shortConcept = concept.length > 100 ? `${concept.slice(0, 97)}...` : concept;

  const { data: subscription, error: subError } = await admin
    .from("subscriptions")
    .insert({
      tenant_id: payload.tenant_id,
      customer_id: customerId,
      customer_name: payload.customer_name.trim(),
      customer_email: payload.customer_email.trim().toLowerCase(),
      customer_phone: payload.customer_phone?.trim() || null,
      type: "recurring",
      frequency,
      frequency_type: frequencyType,
      original_amount: subtotal,
      discount_percent: discountPercent,
      discounted_amount: discountedAmount,
      installment_amount: discountedAmount,
      charge_amount: feeCalc.chargeAmount,
      service_fee_per_charge: serviceFee,
      total_installments: null,
      completed_installments: 0,
      status: "pending_setup",
      mp_fee_absorbed_by: recurringConfig.fee_absorbed_by,
      original_order_id: order.id,
      concept: shortConcept,
      items_snapshot: itemsSnapshot,
      start_date: new Date().toISOString(),
    })
    .select("id")
    .single();

  if (subError || !subscription) {
    return NextResponse.json(
      { error: subError?.message ?? "Error creating subscription" },
      { status: 500 },
    );
  }

  await admin
    .from("orders")
    .update({
      subscription_id: subscription.id,
      subscription_installment: 1,
      payment_mode: "subscription",
      payment_plan_status: "pending",
      total: discountedAmount,
      discount: subtotal - discountedAmount,
      balance_due: discountedAmount,
      updated_at: new Date().toISOString(),
    })
    .eq("id", order.id);

  const attempt = await createPaymentAttempt(admin, {
    order_id: order.id,
    tenant_id: payload.tenant_id,
    mode,
    amount: feeCalc.chargeAmount,
    idempotency_key: idempotencyKey,
    expires_at: expiresAt,
    metadata: {
      checkout_session_id: order.checkout_session_id,
      subscription_id: subscription.id,
    },
  });

  const externalReference = `order:${order.id}:mode:${mode}:attempt:${attempt.id}`;
  await admin
    .from("order_payment_attempts")
    .update({ external_reference: externalReference })
    .eq("id", attempt.id);

  const mpConfig = new MercadoPagoConfig({
    accessToken: process.env.MERCADOPAGO_ACCESS_TOKEN!,
  });
  const preApproval = new PreApproval(mpConfig);
  const startDate = new Date();
  startDate.setDate(startDate.getDate() + 1);

  const backUrl = `${origin}/sitio/${tenantSlug}/confirmacion?order_id=${order.id}&subscription_id=${subscription.id}&status=success&mode=subscription`;
  let mpSubscription;
  try {
    mpSubscription = await preApproval.create({
      body: {
        reason: shortConcept || "Suscripción mensual",
        payer_email: payload.customer_email.trim(),
        back_url: backUrl,
        status: "pending",
        external_reference: externalReference,
        auto_recurring: {
          frequency: frequencyType === "weeks" ? frequency * 7 : frequency,
          frequency_type:
            frequencyType === "weeks" ? "days" : "months",
          transaction_amount: feeCalc.chargeAmount,
          currency_id: "MXN",
          start_date: startDate.toISOString(),
        },
      },
    });
  } catch (err) {
    return NextResponse.json(
      { error: resolveUserError(err, "mercadopago") },
      { status: 500 },
    );
  }

  if (!mpSubscription?.id || !mpSubscription?.init_point) {
    return NextResponse.json(
      { error: "Respuesta inválida de MercadoPago" },
      { status: 502 },
    );
  }

  await admin
    .from("subscriptions")
    .update({
      mp_preapproval_id: mpSubscription.id,
      mp_subscription_init_point: mpSubscription.init_point,
      updated_at: new Date().toISOString(),
    })
    .eq("id", subscription.id);

  await admin
    .from("order_payment_attempts")
    .update({
      provider_reference: mpSubscription.id,
      status: "redirected",
      updated_at: new Date().toISOString(),
    })
    .eq("id", attempt.id);

  return NextResponse.json({
    success: true,
    checkout_mode: "subscription",
    status: "redirect",
    order_id: order.id,
    subscription_id: subscription.id,
    payment_link: mpSubscription.init_point,
    redirect_url: mpSubscription.init_point,
    next_action: "open_payment_link",
  });
}

