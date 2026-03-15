import { createAdminClient } from "@/lib/supabase/admin";
import { NextResponse } from "next/server";
import { PreApproval, MercadoPagoConfig } from "mercadopago";
import { calcSubscriptionFees } from "@/constants/commissionConfig";
import { DEFAULT_RECURRING_CONFIG } from "@/types/subscriptions";
import type { RecurringPurchasesConfig } from "@/types/subscriptions";
import type { SubscriptionItemSnapshot } from "@/types/subscriptions";

const FINGERPRINT_HEADER = "x-fingerprint-id";
const APP_URL = process.env.NEXT_PUBLIC_APP_URL ?? "https://commerce.pars.com.mx";

function getFingerprint(request: Request): string | null {
  return request.headers.get(FINGERPRINT_HEADER)?.trim() || null;
}

export async function POST(request: Request) {
  const fingerprint = getFingerprint(request);
  if (!fingerprint) {
    return NextResponse.json(
      { error: "x-fingerprint-id header is required" },
      { status: 400 },
    );
  }

  let body: {
    tenant_id?: string;
    cart_id?: string;
    customer_name?: string;
    customer_email?: string;
    customer_phone?: string;
    payment_mode?: "installments" | "recurring";
    installments?: number;
    frequency?: number;
    frequency_type?: "weeks" | "months";
  };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const {
    tenant_id,
    cart_id,
    customer_name,
    customer_email,
    customer_phone,
    payment_mode,
    installments,
    frequency,
    frequency_type,
  } = body;

  // ── Validation ──────────────────────────────────────────────────────────────
  if (!tenant_id || !cart_id) {
    return NextResponse.json(
      { error: "tenant_id and cart_id are required" },
      { status: 400 },
    );
  }
  if (!customer_name?.trim() || !customer_email?.trim()) {
    return NextResponse.json(
      { error: "customer_name and customer_email are required" },
      { status: 400 },
    );
  }
  if (!payment_mode || !["installments", "recurring"].includes(payment_mode)) {
    return NextResponse.json(
      { error: "payment_mode must be 'installments' or 'recurring'" },
      { status: 400 },
    );
  }
  if (payment_mode === "installments" && (!installments || installments < 2)) {
    return NextResponse.json(
      { error: "installments must be >= 2" },
      { status: 400 },
    );
  }
  if (!frequency || !frequency_type) {
    return NextResponse.json(
      { error: "frequency and frequency_type are required" },
      { status: 400 },
    );
  }

  const admin = createAdminClient();

  // ── Validate tenant ─────────────────────────────────────────────────────────
  const { data: tenant } = await admin
    .from("tenants")
    .select("id, slug, settings")
    .eq("id", tenant_id)
    .eq("public_store_enabled", true)
    .single();

  if (!tenant) {
    return NextResponse.json(
      { error: "Tenant not found or public store disabled" },
      { status: 404 },
    );
  }

  // ── Load recurring config ───────────────────────────────────────────────────
  const tenantSettings = (tenant.settings as Record<string, unknown> | null) ?? {};
  const rc: RecurringPurchasesConfig = {
    ...DEFAULT_RECURRING_CONFIG,
    ...((tenantSettings.recurring_purchases as Partial<RecurringPurchasesConfig>) ?? {}),
  };

  if (payment_mode === "installments" && !rc.installments_enabled) {
    return NextResponse.json(
      { error: "Pago en cuotas no está habilitado para esta tienda" },
      { status: 400 },
    );
  }
  if (payment_mode === "recurring" && !rc.recurring_enabled) {
    return NextResponse.json(
      { error: "Compra recurrente no está habilitada para esta tienda" },
      { status: 400 },
    );
  }

  // ── Validate cart ───────────────────────────────────────────────────────────
  const { data: cart } = await admin
    .from("public_carts")
    .select("id")
    .eq("id", cart_id)
    .eq("tenant_id", tenant_id)
    .eq("fingerprint_id", fingerprint)
    .single();

  if (!cart) {
    return NextResponse.json({ error: "Cart not found" }, { status: 404 });
  }

  const { data: cartItems } = await admin
    .from("public_cart_items")
    .select("product_id, quantity, price_snapshot, promotion_id, product:products(id, name, image_url)")
    .eq("cart_id", cart_id);

  if (!cartItems || cartItems.length === 0) {
    return NextResponse.json({ error: "Cart is empty" }, { status: 400 });
  }

  // ── Calculate amounts ───────────────────────────────────────────────────────
  const originalAmount = cartItems.reduce(
    (sum, i) => sum + Number(i.price_snapshot) * i.quantity,
    0,
  );

  const discountPercent = payment_mode === "recurring" ? rc.subscription_discount_percent : 0;
  const discountedAmount = Math.round(originalAmount * (1 - discountPercent / 100) * 100) / 100;

  const installmentBase = payment_mode === "installments"
    ? Math.round((discountedAmount / installments!) * 100) / 100
    : discountedAmount;

  // MP minimum: $15 MXN per charge
  if (installmentBase < 15) {
    return NextResponse.json(
      { error: "El monto por cobro debe ser al menos $15 MXN" },
      { status: 400 },
    );
  }

  const fees = calcSubscriptionFees(installmentBase, rc.fee_absorbed_by);
  const serviceFee = Math.round((fees.chargeAmount - installmentBase) * 100) / 100;

  // ── Build items snapshot ────────────────────────────────────────────────────
  const itemsSnapshot: SubscriptionItemSnapshot[] = cartItems.map((item) => {
    const product = Array.isArray(item.product) ? item.product[0] : item.product;
    return {
      product_id: item.product_id,
      name: product?.name ?? "Producto",
      quantity: item.quantity,
      unit_price: Number(item.price_snapshot),
      image_url: product?.image_url ?? null,
      promotion_id: item.promotion_id ?? null,
    };
  });

  const concept = itemsSnapshot.map((i) => i.name).join(", ");
  const shortConcept = concept.length > 100 ? concept.slice(0, 97) + "..." : concept;

  // ── Create order ────────────────────────────────────────────────────────────
  const orderStatus = payment_mode === "installments" ? "installment_active" : "pending_subscription";

  const { data: order, error: orderError } = await admin
    .from("orders")
    .insert({
      tenant_id,
      status: orderStatus,
      subtotal: originalAmount,
      discount: discountPercent > 0 ? originalAmount - discountedAmount : 0,
      total: discountedAmount,
      source: "public_store",
      customer_name: customer_name.trim(),
      customer_email: customer_email.trim(),
      customer_phone: customer_phone?.trim() || null,
    })
    .select("id")
    .single();

  if (orderError || !order) {
    return NextResponse.json(
      { error: orderError?.message ?? "Error creating order" },
      { status: 500 },
    );
  }

  // ── Create order items ──────────────────────────────────────────────────────
  for (const item of cartItems) {
    const qty = item.quantity;
    const unitPrice = Number(item.price_snapshot);
    const totalPrice = unitPrice * qty;
    await admin.from("order_items").insert({
      order_id: order.id,
      product_id: item.product_id,
      quantity: qty,
      unit_price: unitPrice,
      subtotal: totalPrice,
      promotion_id: item.promotion_id ?? null,
    });
  }

  // ── Find or create customer ─────────────────────────────────────────────────
  let customerId: string | null = null;
  const { data: existingCustomer } = await admin
    .from("customers")
    .select("id")
    .eq("tenant_id", tenant_id)
    .eq("email", customer_email.trim().toLowerCase())
    .single();

  if (existingCustomer) {
    customerId = existingCustomer.id;
  } else {
    const { data: newCustomer } = await admin
      .from("customers")
      .insert({
        tenant_id,
        name: customer_name.trim(),
        email: customer_email.trim().toLowerCase(),
        phone: customer_phone?.trim() || null,
      })
      .select("id")
      .single();
    if (newCustomer) {
      customerId = newCustomer.id;
    }
  }

  // Link customer to order
  if (customerId) {
    await admin
      .from("orders")
      .update({ customer_id: customerId })
      .eq("id", order.id);
  }

  // ── Create subscription ─────────────────────────────────────────────────────
  const totalInstallments = payment_mode === "installments" ? installments! : null;

  const { data: subscription, error: subError } = await admin
    .from("subscriptions")
    .insert({
      tenant_id,
      customer_id: customerId,
      customer_name: customer_name.trim(),
      customer_email: customer_email.trim(),
      customer_phone: customer_phone?.trim() || null,
      type: payment_mode,
      frequency,
      frequency_type,
      original_amount: originalAmount,
      discount_percent: discountPercent,
      discounted_amount: discountedAmount,
      installment_amount: installmentBase,
      charge_amount: fees.chargeAmount,
      service_fee_per_charge: serviceFee,
      total_installments: totalInstallments,
      completed_installments: 0,
      status: "pending_setup",
      mp_fee_absorbed_by: rc.fee_absorbed_by,
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

  // Link subscription to order
  await admin
    .from("orders")
    .update({ subscription_id: subscription.id, subscription_installment: 1 })
    .eq("id", order.id);

  // ── Create MP PreApproval ───────────────────────────────────────────────────
  const rawOrigin =
    request.headers.get("origin") ??
    request.headers.get("referer")?.replace(/\/[^/]*$/, "") ??
    "http://localhost:3000";
  const isLocalhost =
    rawOrigin.includes("localhost") || rawOrigin.includes("127.0.0.1");
  const origin = isLocalhost ? APP_URL : rawOrigin;

  const slug = tenant.slug ?? "";
  const backUrl = `${origin}/sitio/${slug}/confirmacion?order_id=${order.id}&subscription_id=${subscription.id}&status=success`;

  const mpConfig = new MercadoPagoConfig({
    accessToken: process.env.MERCADOPAGO_ACCESS_TOKEN!,
  });
  const preApproval = new PreApproval(mpConfig);

  // MP requires start_date to be at least a few seconds in the future
  const startDate = new Date();
  startDate.setDate(startDate.getDate() + 1);

  let mpSubscription;
  try {
    const mpBody = {
      reason: shortConcept,
      payer_email: customer_email.trim(),
      back_url: backUrl,
      status: "pending" as const,
      external_reference: `store_sub:${subscription.id}`,
      auto_recurring: {
        frequency,
        frequency_type: frequency_type as "months" | "weeks",
        transaction_amount: fees.chargeAmount,
        currency_id: "MXN" as const,
        start_date: startDate.toISOString(),
        ...(totalInstallments ? { repetitions: totalInstallments } : {}),
      },
    };
    console.log("[checkout-subscription] Creating MP PreApproval with body:", JSON.stringify(mpBody));
    mpSubscription = await preApproval.create({ body: mpBody });
  } catch (err: unknown) {
    const errMsg = err instanceof Error ? err.message : String(err);
    const errDetail = typeof err === "object" && err !== null && "cause" in err
      ? JSON.stringify((err as { cause: unknown }).cause)
      : undefined;
    console.error("[checkout-subscription] Error en MP PreApproval:", errMsg, errDetail ?? "");
    return NextResponse.json(
      { error: `Error al crear la suscripción en MercadoPago: ${errMsg}` },
      { status: 500 },
    );
  }

  if (!mpSubscription?.id || !mpSubscription?.init_point) {
    return NextResponse.json(
      { error: "Respuesta inválida de MercadoPago" },
      { status: 502 },
    );
  }

  // ── Update subscription with MP data ────────────────────────────────────────
  await admin
    .from("subscriptions")
    .update({
      mp_preapproval_id: mpSubscription.id,
      mp_subscription_init_point: mpSubscription.init_point,
      updated_at: new Date().toISOString(),
    })
    .eq("id", subscription.id);

  // ── Clear cart ──────────────────────────────────────────────────────────────
  await admin.from("public_cart_items").delete().eq("cart_id", cart_id);

  return NextResponse.json({
    subscription_id: subscription.id,
    order_id: order.id,
    init_point: mpSubscription.init_point,
    redirect_url: `/sitio/${slug}/confirmacion?order_id=${order.id}&subscription_id=${subscription.id}`,
  });
}
