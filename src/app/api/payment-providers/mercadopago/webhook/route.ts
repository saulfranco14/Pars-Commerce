import { NextResponse } from "next/server";

import { createAdminClient } from "@/lib/supabase/admin";
import { parseCheckoutReference } from "@/features/orders/helpers/parseCheckoutReference";
import { sha256 } from "@/features/payment-providers/merchantTokenCipher";
import { asPaymentProviderAdmin, getConnectedMercadoPagoConnectionByMerchantAccount } from "@/features/payment-providers/connectionService";
import { getMercadoPagoPayment } from "@/features/payment-providers/mercadoPagoProvider";
import { verifyWebhookSignature } from "@/lib/mercadopagoWebhookVerify";

export const runtime = "nodejs";

interface MercadoPagoWebhook {
  type?: string;
  action?: string;
  user_id?: string | number;
  data?: { id?: string | number };
}

function paymentStatus(status: string | null | undefined) {
  if (status === "approved") return "approved";
  if (status === "cancelled") return "cancelled";
  if (status === "rejected") return "failed";
  return "pending";
}

function merchantId(request: Request, body: MercadoPagoWebhook) {
  const fromBody = body.user_id;
  if (typeof fromBody === "number" || typeof fromBody === "string") return String(fromBody);
  return new URL(request.url).searchParams.get("user_id");
}

export async function POST(request: Request) {
  const body = (await request.json().catch(() => null)) as MercadoPagoWebhook | null;
  const paymentId = body?.data?.id ? String(body.data.id) : null;
  if (!body || !paymentId) return NextResponse.json({ received: true });

  const secret = process.env.MERCADOPAGO_WEBHOOK_SECRET;
  const signatureValid = Boolean(secret) && verifyWebhookSignature(
    { data: { id: paymentId } },
    request.headers.get("x-signature"),
    request.headers.get("x-request-id"),
    secret ?? "",
  );
  if (!signatureValid) {
    return NextResponse.json({ error: "Invalid signature" }, { status: 401 });
  }
  if (body.type !== "payment") return NextResponse.json({ received: true });

  const accountId = merchantId(request, body);
  if (!accountId) {
    // A merchant webhook without the account identifier cannot be safely
    // attributed. Do not guess a connection or touch any financial record.
    return NextResponse.json({ received: true, ignored: "merchant_missing" });
  }

  const admin = asPaymentProviderAdmin(createAdminClient());
  let eventId: string | null = null;
  try {
    const { connection, accessToken } = await getConnectedMercadoPagoConnectionByMerchantAccount(admin, accountId);
    const providerEventId = `${body.type}:${paymentId}:${body.action ?? ""}`;
    const { data: event, error: eventError } = await admin
      .from("payment_provider_events")
      .upsert({
        provider: "mercadopago",
        provider_event_id: providerEventId,
        connection_id: connection.id,
        tenant_id: connection.tenant_id,
        event_type: body.action ?? body.type,
        signature_valid: true,
        processing_status: "received",
        payload_hash: sha256(JSON.stringify(body)),
      }, { onConflict: "provider,provider_event_id", ignoreDuplicates: true })
      .select("id, processing_status")
      .maybeSingle();
    if (eventError) throw new Error(eventError.message);
    eventId = typeof event?.id === "string" ? event.id : null;
    if (event?.processing_status === "processed") return NextResponse.json({ received: true, duplicate: true });

    // The resource query uses the merchant OAuth token. Payload fields alone
    // are never enough to change money, order status, or inventory.
    const mpPayment = await getMercadoPagoPayment(accessToken, paymentId);
    const externalReference = typeof mpPayment.external_reference === "string" ? mpPayment.external_reference : null;
    const parsed = externalReference ? parseCheckoutReference(externalReference) : null;
    if (!parsed || parsed.mode !== "single") {
      if (eventId) await admin.from("payment_provider_events").update({ processing_status: "ignored", processed_at: new Date().toISOString() }).eq("id", eventId);
      return NextResponse.json({ received: true, ignored: "reference" });
    }

    const { data: attempt } = await admin
      .from("order_payment_attempts")
      .select("id, order_id, tenant_id, provider_connection_id")
      .eq("id", parsed.attemptId)
      .maybeSingle();
    if (!attempt || attempt.order_id !== parsed.orderId || attempt.tenant_id !== connection.tenant_id || attempt.provider_connection_id !== connection.id) {
      throw new Error("El pago notificado no corresponde a la conexión del negocio");
    }

    const status = paymentStatus(mpPayment.status);
    const transactionAmount = Number(mpPayment.transaction_amount ?? 0);
    if (!Number.isFinite(transactionAmount) || transactionAmount <= 0) throw new Error("Mercado Pago reportó un importe inválido");
    const netAmount = Number((mpPayment.transaction_details as { net_received_amount?: number } | undefined)?.net_received_amount ?? transactionAmount);
    const providerFee = Math.max(0, Math.round((transactionAmount - netAmount) * 100) / 100);
    const now = new Date().toISOString();

    const { data: payment } = await admin
      .from("payments")
      .select("id, amount, metadata, platform_fee_amount, status")
      .eq("attempt_id", attempt.id)
      .maybeSingle();
    if (!payment) throw new Error("No existe el intento de pago directo para esta orden");
    const expectedAmount = Number(payment.amount);
    if (Math.abs(transactionAmount - expectedAmount) > 0.01) {
      throw new Error("El importe recibido no coincide con la orden de Tlaco");
    }

    await admin.from("order_payment_attempts").update({
      status,
      provider_reference: String(mpPayment.id ?? paymentId),
      updated_at: now,
    }).eq("id", attempt.id);
    await admin.from("payments").update({
      external_id: String(mpPayment.id ?? paymentId),
      provider_payment_id: String(mpPayment.id ?? paymentId),
      status,
      provider_fee_amount: providerFee,
      reconciliation_status: status === "approved" ? "matched" : "pending",
      metadata: {
        ...((payment.metadata as Record<string, unknown> | null) ?? {}),
        mp_status: mpPayment.status,
        mp_status_detail: mpPayment.status_detail,
        mp_payment_method: mpPayment.payment_method_id,
        paid_at: mpPayment.date_approved,
      },
      updated_at: now,
    }).eq("id", payment.id);

    if (status === "approved") {
      const { data: order } = await admin.from("orders")
        .select("id, total, work_metadata")
        .eq("id", parsed.orderId)
        .eq("tenant_id", connection.tenant_id)
        .maybeSingle();
      if (!order || Math.abs(Number(order.total) - expectedAmount) > 0.01) throw new Error("La orden no coincide con el pago notificado");
      await admin.from("orders").update({
        status: "paid",
        paid_total: expectedAmount,
        balance_due: 0,
        paid_at: now,
        payment_method: "mercadopago",
        payment_plan_status: "completed",
        updated_at: now,
      }).eq("id", order.id).in("status", ["pending_payment", "completed"]);
      const publicCartId = (order.work_metadata as Record<string, unknown> | null)?.public_cart_id;
      if (typeof publicCartId === "string") await admin.from("public_cart_items").delete().eq("cart_id", publicCartId);

      const invoiceFee = Number((payment.metadata as Record<string, unknown> | null)?.invoice_fee_amount ?? 0);
      if (invoiceFee > 0) {
        await admin.from("tenant_billing_items").upsert({
          tenant_id: connection.tenant_id,
          period: now.slice(0, 7) + "-01",
          source: "sale_fee",
          source_reference: `payment:${paymentId}`,
          amount: invoiceFee,
          provider: "mercadopago",
          status: "pending",
        }, { onConflict: "tenant_id,source,source_reference", ignoreDuplicates: true });
      }
    }
    if (eventId) await admin.from("payment_provider_events").update({ processing_status: "processed", processed_at: now }).eq("id", eventId);
    return NextResponse.json({ received: true });
  } catch (error) {
    if (eventId) {
      await admin.from("payment_provider_events").update({
        processing_status: "failed",
        failure_reason: error instanceof Error ? error.message : "processing_failed",
        processed_at: new Date().toISOString(),
      }).eq("id", eventId);
    }
    console.error("Merchant Mercado Pago webhook failed", error);
    return NextResponse.json({ error: "processing_failed" }, { status: 500 });
  }
}
