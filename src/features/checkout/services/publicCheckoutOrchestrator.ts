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
import { createOrderItems } from "@/features/checkout/helpers/orderItems";
import type {
  CheckoutMode,
  PublicCheckoutResponse,
} from "@/features/checkout/interfaces/publicCheckout";
import { handlePartialCheckout } from "@/features/checkout/services/partialCheckoutHandler";
import { handleSingleCheckout } from "@/features/checkout/services/singleCheckoutHandler";
import { handleSubscriptionCheckout } from "@/features/checkout/services/subscriptionCheckoutHandler";

import type { RecurringPurchasesConfig } from "@/types/subscriptions";

interface ExecuteCheckoutParams {
  request: Request;
  modeOverride?: CheckoutMode;
}

const ATTEMPT_TTL_MS = 60 * 60 * 1000;

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

  const tenantSettings =
    (tenant.settings as Record<string, unknown> | null) ?? {};
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
      "product_id, quantity, price_snapshot, promotion_id, product:products(id, name, image_url)",
    )
    .eq("cart_id", payload.cart_id);

  if (!cartItems || cartItems.length === 0) {
    return NextResponse.json({ error: "Cart is empty" }, { status: 400 });
  }

  const normalizedItems = cartItems as CartItemRow[];
  const subtotal = calcCartSubtotal(normalizedItems);

  const customerId = await ensureCustomer(
    admin,
    payload.tenant_id,
    payload.customer_name,
    payload.customer_email,
    payload.customer_phone,
  );

  const orderStatus =
    mode === "subscription" ? "pending_subscription" : "pending_payment";
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

  const idempotencyKey =
    request.headers.get("x-idempotency-key")?.trim() ??
    `checkout:${order.id}:${mode}:${Date.now()}`;

  const ctx: CheckoutContext = {
    admin,
    payload,
    tenantSlug: tenant.slug ?? "",
    recurringConfig,
    cartItems: normalizedItems,
    subtotal,
    customerId,
    order,
    origin: getOrigin(request),
    idempotencyKey,
    expiresAt,
    installments,
    frequency,
    frequencyType,
  };

  if (mode === "single") return handleSingleCheckout(ctx);
  if (mode === "partial") return handlePartialCheckout(ctx);
  return handleSubscriptionCheckout(ctx);
}
