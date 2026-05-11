import { createAdminClient } from "@/lib/supabase/admin";
import { paymentClient } from "@/lib/mercadopago";
import { verifyWebhookSignature } from "@/lib/mercadopagoWebhookVerify";
import { NextResponse } from "next/server";
import { parseCheckoutReference } from "@/features/orders/helpers/parseCheckoutReference";
import {
  handleSingleLoanPayment,
  handleBulkLoanPayment,
  handlePreapprovalLoanPayment,
} from "@/features/prestamos/services/loanWebhookHandlers";
import { handleStoreSubscriptionPayment } from "@/features/sitio/services/subscriptionWebhookHandlers";

export async function POST(request: Request) {
  let body: {
    type?: string;
    data?: { id?: string };
    action?: string;
  };
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

  if (body.type === "subscription_preapproval" && body.data?.id) {
    try {
      await handlePreapprovalStatusChange(body.data.id);
    } catch (err) {
      console.error("Webhook: error en subscription_preapproval:", err);
    }
    return NextResponse.json({ received: true });
  }

  if (body.type === "subscription_authorized_payment" && body.data?.id) {
    try {
      await handlePreapprovalPayment(body.data.id);
    } catch (err) {
      console.error("Webhook: error en subscription_authorized_payment:", err);
    }
    return NextResponse.json({ received: true });
  }

  if (body.type !== "payment" || !body.data?.id) {
    return NextResponse.json({ received: true });
  }

  const paymentId = body.data.id;

  try {
    const mpPayment = await paymentClient.get({ id: paymentId });

    if (!mpPayment || !mpPayment.external_reference) {
      console.warn("Webhook: payment without external_reference", paymentId);
      return NextResponse.json({ received: true });
    }

    const externalRef = mpPayment.external_reference;
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

    // ── Pago bulk de préstamos ───────────────────────────────────────────────
    if (externalRef.startsWith("bulk_loan:")) {
      if (mpStatus === "approved") {
        await handleBulkLoanPayment(
          supabase,
          mpPayment.id ? String(mpPayment.id) : String(paymentId),
          String(paymentId),
          transactionAmount,
          mpFeeAmount,
        );
      }
      return NextResponse.json({ received: true });
    }

    // ── Pago de préstamo individual ──────────────────────────────────────────
    if (externalRef.startsWith("loan:")) {
      if (mpStatus === "approved") {
        await handleSingleLoanPayment(
          supabase,
          externalRef,
          String(paymentId),
          transactionAmount,
          mpFeeAmount,
          netReceived,
        );
      }
      return NextResponse.json({ received: true });
    }

    // ── Pago de orden de checkout (single / partial) ─────────────────────────
    const parsedRef = parseCheckoutReference(externalRef);
    const orderId = parsedRef?.orderId ?? externalRef;
    const checkoutMode = parsedRef?.mode ?? "single";
    const attemptId = parsedRef?.attemptId ?? null;
    const splitGroupId = parsedRef?.splitGroupId ?? null;

    if (attemptId) {
      const attemptStatus =
        mpStatus === "approved"
          ? "approved"
          : mpStatus === "cancelled"
            ? "cancelled"
            : mpStatus === "rejected"
              ? "failed"
              : "pending";

      await supabase
        .from("order_payment_attempts")
        .update({
          status: attemptStatus,
          provider_reference: String(mpPayment.id ?? paymentId),
          updated_at: new Date().toISOString(),
        })
        .eq("id", attemptId);
    }

    if (mpStatus === "approved") {
      const { data: order } = await supabase
        .from("orders")
        .select(
          "id, assigned_to, created_by, tenant_id, total, paid_total, balance_due, status, payment_mode, work_metadata",
        )
        .eq("id", orderId)
        .in("status", [
          "pending_payment",
          "completed",
          "partial",
          "installment_active",
          "pending_subscription",
        ])
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

      let appliedAmount = transactionAmount;
      let installmentNumber: number | null = null;

      if (checkoutMode === "partial" && attemptId) {
        const { data: attemptData } = await supabase
          .from("order_payment_attempts")
          .select("metadata")
          .eq("id", attemptId)
          .single();

        const attemptMetadata =
          (attemptData?.metadata as Record<string, unknown> | null) ?? {};
        const scheduleId =
          typeof attemptMetadata.schedule_id === "string"
            ? attemptMetadata.schedule_id
            : null;
        const installment =
          typeof attemptMetadata.installment_number === "number"
            ? attemptMetadata.installment_number
            : null;

        if (installment) installmentNumber = installment;

        if (scheduleId) {
          const { data: schedule } = await supabase
            .from("order_payment_schedules")
            .select("id, amount_due, installment_number")
            .eq("id", scheduleId)
            .single();

          if (schedule) {
            appliedAmount = Number(schedule.amount_due);
            installmentNumber = schedule.installment_number;
            await supabase
              .from("order_payment_schedules")
              .update({
                status: "paid",
                amount_paid: appliedAmount,
                mp_payment_id: String(paymentId),
                paid_at: new Date().toISOString(),
                updated_at: new Date().toISOString(),
              })
              .eq("id", schedule.id);
          }
        }
      }

      const currentPaid = Number(order?.paid_total ?? 0);
      const orderTotal = Number(order?.total ?? 0);
      const nextPaidTotal = Math.min(orderTotal, currentPaid + appliedAmount);
      const nextBalance = Math.max(0, orderTotal - nextPaidTotal);
      const nextStatus =
        nextBalance <= 0
          ? "paid"
          : checkoutMode === "partial"
            ? "partial"
            : "paid";

      const updatePayload: Record<string, string | number | null> = {
        status: nextStatus,
        paid_total: nextPaidTotal,
        balance_due: nextBalance,
        payment_method: "mercadopago",
        payment_plan_status:
          checkoutMode === "partial" && nextBalance > 0
            ? "active"
            : "completed",
        updated_at: new Date().toISOString(),
      };
      if (nextBalance <= 0) updatePayload.paid_at = new Date().toISOString();
      if (assignTo) updatePayload.assigned_to = assignTo;

      await supabase
        .from("orders")
        .update(updatePayload)
        .eq("id", orderId)
        .in("status", [
          "pending_payment",
          "completed",
          "partial",
          "installment_active",
          "pending_subscription",
        ]);

      const { data: existingPayment } = await supabase
        .from("payments")
        .select("id")
        .eq("attempt_id", attemptId)
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
            amount: appliedAmount,
            installment_number: installmentNumber,
            split_group_id: splitGroupId,
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
          amount: appliedAmount,
          payment_kind:
            checkoutMode === "partial" || splitGroupId ? "partial" : "single",
          attempt_id: attemptId,
          installment_number: installmentNumber,
          split_group_id: splitGroupId,
          idempotency_key: attemptId ? `payment:${attemptId}` : null,
          metadata: paymentMetadata,
        });
      }

      const orderMetadata =
        (order?.work_metadata as Record<string, unknown> | null) ?? {};
      const publicCartId =
        typeof orderMetadata.public_cart_id === "string"
          ? orderMetadata.public_cart_id
          : null;
      if (publicCartId && nextStatus === "paid") {
        await supabase
          .from("public_cart_items")
          .delete()
          .eq("cart_id", publicCartId);
      }

      console.log(
        `Webhook: order ${orderId} marked as paid (payment ${paymentId})`,
      );
    } else {
      const { data: existingPayment } = await supabase
        .from("payments")
        .select("id")
        .eq("attempt_id", attemptId)
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
    return NextResponse.json({ received: true });
  }
}

// =============================================================================
// Orquestador: cambio de estado de preapproval (afecta loans Y subscriptions)
// Queda en el route porque cruza dos dominios (prestamos + sitio)
// =============================================================================
async function handlePreapprovalStatusChange(
  preapprovalId: string,
): Promise<void> {
  const supabase = createAdminClient();

  const mpRes = await fetch(
    `https://api.mercadopago.com/preapproval/${preapprovalId}`,
    {
      headers: {
        Authorization: `Bearer ${process.env.MERCADOPAGO_ACCESS_TOKEN}`,
      },
    },
  );

  if (!mpRes.ok) {
    console.error(
      `Webhook: error fetching preapproval ${preapprovalId} from MP:`,
      mpRes.status,
      await mpRes.text(),
    );
    return;
  }

  const mpData = await mpRes.json();
  const mpStatus: string = mpData.status;

  const statusMap: Record<string, string> = {
    authorized: "active",
    paused: "paused",
    cancelled: "cancelled",
    pending: "pending_setup",
  };

  const newPlanStatus = statusMap[mpStatus];
  if (!newPlanStatus) {
    console.warn(
      `Webhook: unknown preapproval status "${mpStatus}" for ${preapprovalId}`,
    );
    return;
  }

  const { data: loan } = await supabase
    .from("loans")
    .select("id, payment_plan_status")
    .eq("mp_preapproval_id", preapprovalId)
    .single();

  if (loan) {
    if (loan.payment_plan_status === newPlanStatus) return;
    await supabase
      .from("loans")
      .update({
        payment_plan_status: newPlanStatus,
        updated_at: new Date().toISOString(),
      })
      .eq("id", loan.id);
    console.log(
      `Webhook: preapproval ${preapprovalId} → loan ${loan.id} plan_status="${newPlanStatus}"`,
    );
    return;
  }

  const { data: subscription } = await supabase
    .from("subscriptions")
    .select("id, status")
    .eq("mp_preapproval_id", preapprovalId)
    .single();

  if (subscription) {
    if (subscription.status === newPlanStatus) return;

    const updatePayload: Record<string, string> = {
      status: newPlanStatus,
      updated_at: new Date().toISOString(),
    };
    if (newPlanStatus === "cancelled") {
      updatePayload.cancelled_at = new Date().toISOString();
    }

    await supabase
      .from("subscriptions")
      .update(updatePayload)
      .eq("id", subscription.id);

    console.log(
      `Webhook: preapproval ${preapprovalId} → subscription ${subscription.id} status="${newPlanStatus}"`,
    );
    return;
  }

  console.warn(
    `Webhook: no loan or subscription found for preapproval_id ${preapprovalId}`,
  );
}

// =============================================================================
// Orquestador: cobro automático de preapproval
// Decide si el pago aplica a un loan (prestamos) o a una suscripción (sitio)
// =============================================================================
async function handlePreapprovalPayment(
  authorizedPaymentId: string,
): Promise<void> {
  const supabase = createAdminClient();

  let preapprovalId: string | null = null;
  try {
    const mpRes = await fetch(
      `https://api.mercadopago.com/authorized_payments/${authorizedPaymentId}`,
      {
        headers: {
          Authorization: `Bearer ${process.env.MERCADOPAGO_ACCESS_TOKEN}`,
        },
      },
    );
    if (mpRes.ok) {
      const mpData = await mpRes.json();
      preapprovalId = mpData.preapproval_id ?? null;
    }
  } catch (err) {
    console.error(
      `Webhook: error fetching authorized_payment ${authorizedPaymentId} from MP:`,
      err,
    );
  }

  const appliedToLoan = await handlePreapprovalLoanPayment(
    supabase,
    authorizedPaymentId,
    preapprovalId,
  );

  if (!appliedToLoan) {
    await handleStoreSubscriptionPayment(
      supabase,
      authorizedPaymentId,
      preapprovalId,
    );
  }
}
