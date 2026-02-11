import { createAdminClient } from "@/lib/supabase/admin";
import { paymentClient } from "@/lib/mercadopago";
import { NextResponse } from "next/server";

export async function POST(request: Request) {
  // Parse notification from MercadoPago
  let body: { type?: string; data?: { id?: string }; action?: string };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  // Only process payment notifications
  if (body.type !== "payment" || !body.data?.id) {
    // Acknowledge other notification types
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
    const mpStatus = mpPayment.status; // approved, pending, rejected, etc.
    const supabase = createAdminClient();

    if (mpStatus === "approved") {
      // Update order to paid
      await supabase
        .from("orders")
        .update({
          status: "paid",
          paid_at: new Date().toISOString(),
          payment_method: "mercadopago",
          updated_at: new Date().toISOString(),
        })
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

      if (existingPayment) {
        await supabase
          .from("payments")
          .update({
            external_id: String(paymentId),
            status: "approved",
            metadata: {
              mp_payment_id: paymentId,
              mp_status: mpStatus,
              mp_status_detail: mpPayment.status_detail,
              mp_payment_method: mpPayment.payment_method_id,
              paid_at: mpPayment.date_approved,
            },
            updated_at: new Date().toISOString(),
          })
          .eq("id", existingPayment.id);
      } else {
        await supabase.from("payments").insert({
          order_id: orderId,
          provider: "mercadopago",
          external_id: String(paymentId),
          status: "approved",
          amount: Number(mpPayment.transaction_amount ?? 0),
          metadata: {
            mp_payment_id: paymentId,
            mp_status: mpStatus,
            mp_status_detail: mpPayment.status_detail,
            mp_payment_method: mpPayment.payment_method_id,
            paid_at: mpPayment.date_approved,
          },
        });
      }

      console.log(`Webhook: order ${orderId} marked as paid (payment ${paymentId})`);
    } else {
      // For non-approved statuses, just update the payment record metadata
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
            },
            updated_at: new Date().toISOString(),
          })
          .eq("id", existingPayment.id);
      }

      console.log(
        `Webhook: order ${orderId} payment ${paymentId} status: ${mpStatus}`
      );
    }

    return NextResponse.json({ received: true });
  } catch (err: unknown) {
    console.error("Webhook processing error:", err);
    // Still return 200 to prevent MercadoPago from retrying
    return NextResponse.json({ received: true });
  }
}
