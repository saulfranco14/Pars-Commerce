import { NextResponse } from "next/server";

import { DEFAULT_RECURRING_CONFIG } from "@/types/subscriptions";
import type { RecurringPurchasesConfig } from "@/types/subscriptions";
import { createAdminClient } from "@/lib/supabase/admin";
import { resolveUserError } from "@/lib/errors/resolveUserError";
import { handleSingleCheckout } from "@/features/checkout/services/singleCheckoutHandler";
import type { CheckoutContext } from "@/features/checkout/helpers/checkoutContext";
import { ensureCustomer } from "@/features/checkout/helpers/ensureCustomer";

const ATTEMPT_TTL_MS = 60 * 60 * 1000;

interface RequestBody {
  tenant_id: string;
  qr_code_id: string;
  customer_name: string;
  customer_email: string;
  customer_phone?: string;
  amount: number;
}

export async function POST(request: Request) {
  let body: RequestBody;
  try {
    body = (await request.json()) as RequestBody;
  } catch {
    return NextResponse.json({ error: "JSON inválido" }, { status: 400 });
  }

  if (
    !body.tenant_id ||
    !body.qr_code_id ||
    !Number.isFinite(body.amount) ||
    Number(body.amount) <= 0
  ) {
    return NextResponse.json(
      { error: "tenant_id, qr_code_id y amount son requeridos" },
      { status: 400 },
    );
  }

  // Name and email are optional for anonymous QR payments (tips). Fall back
  // to safe defaults so downstream code keeps working without forcing the
  // customer to share PII.
  const customerName = body.customer_name?.trim() || "Cliente";
  const customerEmail = body.customer_email?.trim() || "anonimo@pars.com.mx";

  const admin = createAdminClient();
  const { data: tenant } = await admin
    .from("tenants")
    .select("id, slug")
    .eq("id", body.tenant_id)
    .single();

  if (!tenant) {
    return NextResponse.json({ error: "Negocio no encontrado" }, { status: 404 });
  }

  // Resolve the QR token so the back_urls can point at the branded
  // `/q/{token}/payment/success` page rather than the generic storefront
  // confirmation route.
  const { data: qrRow } = await admin
    .from("qr_codes")
    .select("token")
    .eq("id", body.qr_code_id)
    .maybeSingle();
  const qrToken = qrRow?.token ?? null;

  const customerId = await ensureCustomer(
    admin,
    body.tenant_id,
    customerName,
    customerEmail,
    body.customer_phone,
  );

  const expiresAt = new Date(Date.now() + ATTEMPT_TTL_MS).toISOString();
  const total = Number(body.amount);

  const { data: order, error: orderError } = await admin
    .from("orders")
    .insert({
      tenant_id: body.tenant_id,
      status: "pending_payment",
      subtotal: total,
      discount: 0,
      total,
      source: "qr_payment",
      order_type: "qr_payment",
      qr_code_id: body.qr_code_id,
      customer_id: customerId,
      customer_name: customerName,
      customer_email: customerEmail.toLowerCase(),
      customer_phone: body.customer_phone?.trim() || null,
      payment_mode: "single",
      payment_plan_status: "none",
      paid_total: 0,
      balance_due: total,
      expires_at: expiresAt,
      work_metadata: { checkout_mode: "single", qr_payment: true },
    })
    .select("id, checkout_session_id")
    .single();

  if (orderError || !order) {
    return NextResponse.json(
      { error: resolveUserError(orderError, "supabase") },
      { status: 500 },
    );
  }

  await admin.from("order_activity_log").insert({
    order_id: order.id,
    actor_type: "device",
    actor_label: customerName,
    action: "order.created",
    payload: {
      order_type: "qr_payment",
      amount: total,
      qr_code_id: body.qr_code_id,
    },
  });

  const ctx: CheckoutContext = {
    admin,
    payload: {
      tenant_id: body.tenant_id,
      cart_id: `qr-payment:${body.qr_code_id}`,
      customer_name: customerName,
      customer_email: customerEmail.toLowerCase(),
      customer_phone: body.customer_phone?.trim() || "",
      mode: "single",
      msi_option: 1,
    },
    tenantSlug: tenant.slug,
    // Business absorbs MP fee for QR payments (especially tips) — the
    // customer pays exactly the amount they chose.
    recurringConfig: {
      ...DEFAULT_RECURRING_CONFIG,
      fee_absorbed_by: "business",
    } as RecurringPurchasesConfig,
    cartItems: [
      {
        product_id: body.qr_code_id,
        quantity: 1,
        price_snapshot: total,
        promotion_id: null,
        product: {
          id: body.qr_code_id,
          name: "Cobro QR",
          image_url: null,
        },
      },
    ],
    subtotal: total,
    customerId,
    order,
    origin:
      request.headers.get("origin") ||
      process.env.NEXT_PUBLIC_APP_URL ||
      "http://localhost:3000",
    idempotencyKey: `qr-checkout:${order.id}`,
    expiresAt,
    installments: 0,
    frequency: 1,
    frequencyType: "months",
    // Land back on the branded QR success page when we have a token.
    backUrls: qrToken
      ? {
          success: `${request.headers.get("origin") || process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"}/q/${qrToken}/payment/success?order_id=${order.id}&status=success`,
          failure: `${request.headers.get("origin") || process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"}/q/${qrToken}/payment/success?order_id=${order.id}&status=failure`,
          pending: `${request.headers.get("origin") || process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"}/q/${qrToken}/payment/success?order_id=${order.id}&status=pending`,
        }
      : undefined,
  };

  return handleSingleCheckout(ctx);
}
