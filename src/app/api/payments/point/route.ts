import { NextResponse } from "next/server";

import { requirePermission } from "@/lib/auth/requirePermission";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { createPaymentAttempt } from "@/features/checkout/helpers/paymentAttempt";
import {
  asPaymentProviderAdmin,
  attachConnectionToAttempt,
  calculatePlatformFee,
  createMerchantPendingPayment,
  getActiveSaleFeePolicy,
  getConnectedMercadoPagoConnection,
} from "@/features/payment-providers/connectionService";
import { createMercadoPagoPointOrder } from "@/features/payment-providers/mercadoPagoProvider";

interface PointRequest { order_id?: unknown; terminal_id?: unknown }

export async function POST(request: Request) {
  const body = (await request.json().catch(() => null)) as PointRequest | null;
  const orderId = typeof body?.order_id === "string" ? body.order_id : "";
  const terminalId = typeof body?.terminal_id === "string" ? body.terminal_id : "";
  if (!orderId || !terminalId) return NextResponse.json({ error: "order_id y terminal_id son requeridos" }, { status: 400 });
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const admin = asPaymentProviderAdmin(createAdminClient());
  const { data: order } = await admin.from("orders")
    .select("id, tenant_id, total, checkout_session_id, status")
    .eq("id", orderId).maybeSingle();
  if (!order) return NextResponse.json({ error: "No encontramos esa orden" }, { status: 404 });
  const allowed = await requirePermission(user.id, order.tenant_id, "payments.write");
  if (!allowed) return NextResponse.json({ error: "Tu rol no puede registrar cobros" }, { status: 403 });
  if (order.status === "paid" || order.status === "cancelled") return NextResponse.json({ error: "La orden ya no admite un cobro Point" }, { status: 409 });

  try {
    const { connection, accessToken } = await getConnectedMercadoPagoConnection(admin, order.tenant_id);
    const { data: terminal } = await admin.from("payment_provider_terminals")
      .select("id, connection_id, provider_terminal_id, operating_mode, status")
      .eq("id", terminalId).eq("connection_id", connection.id).maybeSingle();
    if (!terminal || terminal.operating_mode !== "PDV" || terminal.status !== "active") {
      return NextResponse.json({ error: "La terminal no pertenece a esta cuenta o no está lista para Point" }, { status: 409 });
    }
    const idempotencyKey = request.headers.get("x-idempotency-key")?.trim() ?? `point:${order.id}:${Date.now()}`;
    const attempt = await createPaymentAttempt(admin, {
      order_id: order.id, tenant_id: order.tenant_id, mode: "single", amount: Number(order.total),
      idempotency_key: idempotencyKey, expires_at: new Date(Date.now() + 15 * 60 * 1000).toISOString(),
      metadata: { channel: "point", terminal_id: terminal.id, created_by: user.id },
    });
    await attachConnectionToAttempt({ admin, attemptId: attempt.id, connectionId: connection.id });
    const externalReference = `order:${order.id}:mode:single:attempt:${attempt.id}`;
    await admin.from("order_payment_attempts").update({ external_reference: externalReference }).eq("id", attempt.id);
    const policy = await getActiveSaleFeePolicy(admin, order.tenant_id);
    const fee = calculatePlatformFee({ policy, amount: Number(order.total), splitEnabled: false, forceInvoice: true });
    const pointOrder = await createMercadoPagoPointOrder({
      accessToken, terminalId: terminal.provider_terminal_id, externalReference,
      title: `Orden Tlaco ${order.id.slice(0, 8)}`,
      amount: Number(order.total),
      notificationUrl: `${new URL(request.url).origin}/api/payment-providers/mercadopago/webhook`,
    });
    await admin.from("order_payment_attempts").update({ provider_reference: pointOrder.providerOrderId, status: "pending", updated_at: new Date().toISOString() }).eq("id", attempt.id);
    await createMerchantPendingPayment({
      admin, orderId: order.id, attemptId: attempt.id, checkoutSessionId: order.checkout_session_id,
      amount: Number(order.total), preferenceId: pointOrder.providerOrderId, paymentLink: "",
      connection, platformFeeAmount: 0, invoiceFeeAmount: fee.invoiceFee,
      idempotencyKey: `payment:${attempt.id}`,
    });
    return NextResponse.json({ success: true, attempt_id: attempt.id, provider_order_id: pointOrder.providerOrderId, status: "sent_to_point" });
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : "No pudimos enviar el cobro a Point" }, { status: 500 });
  }
}
