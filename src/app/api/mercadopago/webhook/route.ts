import { createAdminClient } from "@/lib/supabase/admin";
import { paymentClient } from "@/lib/mercadopago";
import { verifyWebhookSignature } from "@/lib/mercadopagoWebhookVerify";
import { NextResponse } from "next/server";

export async function POST(request: Request) {
  let body: { type?: string; data?: { id?: string }; action?: string };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const webhookSecret = process.env.MERCADOPAGO_WEBHOOK_SECRET;
  const xSignature = request.headers.get("x-signature");
  const xRequestId = request.headers.get("x-request-id");

  if (webhookSecret) {
    const valid = verifyWebhookSignature(
      body,
      xSignature,
      xRequestId,
      webhookSecret,
    );
    if (!valid) {
      console.warn("Webhook: invalid signature, rejecting");
      return NextResponse.json({ error: "Invalid signature" }, { status: 401 });
    }
  } else if (process.env.NODE_ENV === "production") {
    console.warn("Webhook: MERCADOPAGO_WEBHOOK_SECRET not set in production");
    return NextResponse.json(
      { error: "Webhook secret not configured" },
      { status: 401 },
    );
  }

  if (body.type !== "payment" || !body.data?.id) {
    return NextResponse.json({ received: true });
  }

  const paymentId = body.data.id;

  try {
    // Fetch payment details from MercadoPago API
    const mpPayment = await paymentClient.get({ id: paymentId });

    if (!mpPayment || !mpPayment.external_reference) {
      console.warn("Webhook: payment without external_reference", paymentId);
      return NextResponse.json({ received: true });
    }

    const orderId = mpPayment.external_reference;
    const mpStatus = mpPayment.status;
    const transactionAmount = Number(mpPayment.transaction_amount ?? 0);
    const netReceived =
      Number(
        (mpPayment.transaction_details as { net_received_amount?: number })
          ?.net_received_amount ?? 0,
      ) ?? 0;
    const mpFeeAmount =
      Math.round((transactionAmount - netReceived) * 100) / 100;
    const parsFeeAmount = 0;
    const supabase = createAdminClient();

    if (mpStatus === "approved") {
      const { data: order } = await supabase
        .from("orders")
        .select("id, assigned_to, created_by, tenant_id")
        .eq("id", orderId)
        .in("status", ["pending_payment", "completed"])
        .single();

      let assignTo: string | null = order?.assigned_to ?? null;
      if (!assignTo && order) {
        assignTo = order.created_by ?? null;
        if (!assignTo) {
          const { data: ownerRole } = await supabase
            .from("tenant_roles")
            .select("id")
            .eq("tenant_id", order.tenant_id)
            .eq("name", "owner")
            .limit(1)
            .single();
          if (ownerRole) {
            const { data: ownerMembership } = await supabase
              .from("tenant_memberships")
              .select("user_id")
              .eq("tenant_id", order.tenant_id)
              .eq("role_id", ownerRole.id)
              .limit(1)
              .single();
            assignTo = ownerMembership?.user_id ?? null;
          }
        }
      }

      const updatePayload: Record<string, string | null> = {
        status: "paid",
        paid_at: new Date().toISOString(),
        payment_method: "mercadopago",
        updated_at: new Date().toISOString(),
      };
      if (assignTo) {
        updatePayload.assigned_to = assignTo;
      }

      await supabase
        .from("orders")
        .update(updatePayload)
        .eq("id", orderId)
        .in("status", ["pending_payment", "completed"]);

      // Update or insert payment record
      const { data: existingPayment } = await supabase
        .from("payments")
        .select("id")
        .eq("order_id", orderId)
        .eq("provider", "mercadopago")
        .limit(1)
        .single();

      const paymentMetadata = {
        mp_payment_id: paymentId,
        mp_status: mpStatus,
        mp_status_detail: mpPayment.status_detail,
        mp_payment_method: mpPayment.payment_method_id,
        paid_at: mpPayment.date_approved,
        mp_fee_amount: mpFeeAmount,
        pars_fee_amount: parsFeeAmount,
      };

      if (existingPayment) {
        await supabase
          .from("payments")
          .update({
            external_id: String(paymentId),
            status: "approved",
            metadata: paymentMetadata,
            updated_at: new Date().toISOString(),
          })
          .eq("id", existingPayment.id);
      } else {
        await supabase.from("payments").insert({
          order_id: orderId,
          provider: "mercadopago",
          external_id: String(paymentId),
          status: "approved",
          amount: transactionAmount,
          metadata: paymentMetadata,
        });
      }

      console.log(
        `Webhook: order ${orderId} marked as paid (payment ${paymentId})`,
      );
    } else {
      const { data: existingPayment } = await supabase
        .from("payments")
        .select("id")
        .eq("order_id", orderId)
        .eq("provider", "mercadopago")
        .limit(1)
        .single();

      if (existingPayment) {
        await supabase
          .from("payments")
          .update({
            external_id: String(paymentId),
            status: mpStatus ?? "unknown",
            metadata: {
              mp_payment_id: paymentId,
              mp_status: mpStatus,
              mp_status_detail: mpPayment.status_detail,
              mp_fee_amount: mpFeeAmount,
              pars_fee_amount: parsFeeAmount,
            },
            updated_at: new Date().toISOString(),
          })
          .eq("id", existingPayment.id);
      }

      console.log(
        `Webhook: order ${orderId} payment ${paymentId} status: ${mpStatus}`,
      );
    }

    return NextResponse.json({ received: true });
  } catch (err: unknown) {
    console.error("Webhook processing error:", err);
    // Still return 200 to prevent MercadoPago from retrying
    return NextResponse.json({ received: true });
  }
}
