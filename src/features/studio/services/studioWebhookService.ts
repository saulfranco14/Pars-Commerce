import "server-only";
import { studioNextPeriodEnd } from "../helpers/billingPeriods";
import { createHash } from "node:crypto";
import { studioDb } from "./studioDb";
import { requireStudioData, StudioError } from "./studioErrors";
import { studioMpRequest, verifyStudioPayment } from "./studioPaymentProvider";
import type {
  StudioMpInvoice,
  StudioMpPayment,
  StudioMpSubscription,
} from "./studioPaymentProvider";

async function applyStudioPayment(
  payment: StudioMpPayment,
  invoice?: StudioMpInvoice,
  preapproval?: StudioMpSubscription,
): Promise<boolean> {
  const ref =
    payment.external_reference ?? preapproval?.external_reference ?? "";
  if (
    !ref.startsWith("studio_credit_pack:") &&
    !ref.startsWith("studio_subscription:")
  )
    return false;
  const db = studioDb();
  await verifyStudioPayment(payment);
  const paymentId = String(payment.id);
  const refunded = Number(payment.transaction_amount_refunded ?? 0);
  if (
    payment.status !== "refunded" &&
    payment.status !== "charged_back" &&
    refunded > 0 &&
    refunded < Number(payment.transaction_amount)
  ) {
    requireStudioData(
      await db.rpc("studio_flag_partial_refund", {
        p_provider_payment_id: paymentId,
        p_refunded_mxn: refunded,
      }),
    );
    return true;
  }
  if (
    ["refunded", "charged_back"].includes(payment.status) ||
    Number(payment.transaction_amount_refunded ?? 0) > 0
  ) {
    requireStudioData(
      await db.rpc("studio_reverse_payment", {
        p_provider_payment_id: paymentId,
        p_disputed: payment.status === "charged_back",
        ...(payment.status !== "charged_back" && refunded > 0
          ? { p_refunded_mxn: refunded }
          : {}),
      }),
    );
    return true;
  }
  if (payment.status !== "approved") return true;
  if (!payment.date_approved)
    throw new StudioError(
      "PAYMENT_PENDING",
      "El pago no tiene fecha de aprobación verificable.",
      409,
    );
  const recorded = await db
    .from("studio_payments")
    .select("id")
    .eq("provider_payment_id", paymentId)
    .maybeSingle();
  if (recorded.error) throw new StudioError("INTERNAL");
  if (recorded.data) return true;
  if (ref.startsWith("studio_credit_pack:")) {
    requireStudioData(
      await db.rpc("apply_studio_credit_purchase", {
        p_order_id: ref.slice("studio_credit_pack:".length),
        p_provider_payment_id: paymentId,
        p_amount: Number(payment.transaction_amount),
        p_paid_at: payment.date_approved,
      }),
    );
    return true;
  }
  if (!invoice || !preapproval || !invoice.preapproval_id) return true;
  const sub = requireStudioData(
    await db
      .from("tenant_studio_subscriptions")
      .select("*")
      .eq("id", ref.slice("studio_subscription:".length))
      .single(),
  );
  if (sub.mp_preapproval_id && sub.mp_preapproval_id !== invoice.preapproval_id)
    throw new StudioError("PAYMENT_MISMATCH");
  if (!sub.mp_preapproval_id)
    requireStudioData(
      await db
        .from("tenant_studio_subscriptions")
        .update({ mp_preapproval_id: invoice.preapproval_id })
        .eq("id", sub.id)
        .is("mp_preapproval_id", null)
        .select("id")
        .single(),
    );
  const startsAt =
    invoice.debit_date ??
    (sub.current_period_start === null
      ? (preapproval.auto_recurring?.start_date ?? payment.date_approved)
      : null);
  if (!startsAt || !Number.isFinite(new Date(startsAt).getTime()))
    throw new StudioError(
      "PAYMENT_PENDING",
      "Falta confirmar el periodo del cobro recurrente.",
      409,
    );
  requireStudioData(
    await db.rpc("grant_studio_subscription_credits", {
      p_subscription_id: sub.id,
      p_provider_payment_id: paymentId,
      p_authorized_payment_id: String(invoice.id),
      p_amount: Number(payment.transaction_amount),
      p_paid_at: payment.date_approved,
      p_starts_at: new Date(startsAt).toISOString(),
      p_ends_at: studioNextPeriodEnd(
        startsAt,
        preapproval.auto_recurring?.start_date,
        preapproval.next_payment_date,
      ),
    }),
  );
  return true;
}

async function resolveStudioMpResource(
  type: string,
  id: string,
): Promise<boolean> {
  const db = studioDb();
  if (type === "payment") {
    const payment = await studioMpRequest<StudioMpPayment>(
      `v1/payments/${encodeURIComponent(id)}`,
    );
    return applyStudioPayment(payment);
  }
  if (type === "subscription_preapproval") {
    const preapproval = await studioMpRequest<StudioMpSubscription>(
      `preapproval/${encodeURIComponent(id)}`,
    );
    if (!preapproval.external_reference?.startsWith("studio_subscription:"))
      return false;
    const sub = requireStudioData(
      await db
        .from("tenant_studio_subscriptions")
        .select("*")
        .eq(
          "id",
          preapproval.external_reference.slice("studio_subscription:".length),
        )
        .single(),
    );
    if (sub.mp_preapproval_id && sub.mp_preapproval_id !== id) return true;
    if (preapproval.status === "cancelled" || preapproval.status === "paused") {
      requireStudioData(
        await db
          .from("tenant_studio_subscriptions")
          .update({
            status:
              sub.current_period_end &&
              new Date(sub.current_period_end) > new Date()
                ? "cancelling"
                : "cancelled",
            cancel_at_period_end: true,
            pending_plan_code: null,
            pending_amount_mxn: null,
            pending_tlacos: null,
            plan_change_status: null,
            updated_at: new Date().toISOString(),
          })
          .eq("id", sub.id)
          .select("id")
          .single(),
      );
    }
    if (
      preapproval.status === "authorized" &&
      sub.pending_plan_code &&
      Number(preapproval.auto_recurring?.transaction_amount) ===
        Number(sub.pending_amount_mxn)
    )
      requireStudioData(
        await db.rpc("studio_confirm_plan_change", {
          p_subscription_id: sub.id,
          p_plan_code: sub.pending_plan_code,
          p_amount: Number(sub.pending_amount_mxn),
        }),
      );
    return true;
  }
  if (type === "subscription_authorized_payment") {
    const invoice = await studioMpRequest<StudioMpInvoice>(
      `authorized_payments/${encodeURIComponent(id)}`,
    );
    if (!invoice.preapproval_id)
      throw new StudioError(
        "PAYMENT_PENDING",
        "Falta confirmar la suscripción del cobro.",
        409,
      );
    const preapproval = await studioMpRequest<StudioMpSubscription>(
      `preapproval/${encodeURIComponent(invoice.preapproval_id)}`,
    );
    if (!preapproval.external_reference?.startsWith("studio_subscription:"))
      return false;
    const paymentId = invoice.payment?.id ?? invoice.payment_id;
    if (!paymentId)
      throw new StudioError(
        "PAYMENT_PENDING",
        "El cobro recurrente todavía no tiene un pago verificable.",
        409,
      );
    return applyStudioPayment(
      await studioMpRequest<StudioMpPayment>(
        `v1/payments/${encodeURIComponent(String(paymentId))}`,
      ),
      invoice,
      preapproval,
    );
  }
  return false;
}

export async function isKnownStudioResource(
  type: string,
  id: string,
): Promise<boolean> {
  const db = studioDb();
  const result =
    type === "subscription_preapproval"
      ? await db
          .from("tenant_studio_subscriptions")
          .select("id")
          .eq("mp_preapproval_id", id)
          .maybeSingle()
      : type === "payment"
        ? await db
            .from("studio_payments")
            .select("id")
            .eq("provider_payment_id", id)
            .maybeSingle()
        : type === "subscription_authorized_payment"
          ? await db
              .from("studio_payments")
              .select("id")
              .eq("authorized_payment_id", id)
              .maybeSingle()
          : null;
  if (!result) return false;
  if (result.error?.code === "42P01" || result.error?.code === "PGRST205")
    return false;
  if (result.error) throw new StudioError("NOT_CONFIGURED");
  return Boolean(result.data);
}

/** For the shared webhook: a failed lookup must not hold up merchant payments; Studio's own references are still caught by their prefix. */
export async function belongsToStudio(
  type: string,
  id: string,
): Promise<boolean> {
  try {
    return await isKnownStudioResource(type, id);
  } catch (error) {
    console.error("[studio] webhook lookup failed, continuing", {
      type,
      error: error instanceof Error ? error.message : "Unknown",
    });
    return false;
  }
}

export async function handleStudioMpResource(
  type: string,
  id: string,
): Promise<boolean> {
  try {
    return await resolveStudioMpResource(type, id);
  } catch (error) {
    // Merchant OAuth notifications can reference resources outside Tlaco's billing account.
    if (error instanceof StudioError && error.code === "PROVIDER_NOT_FOUND") {
      if (await isKnownStudioResource(type, id))
        throw new StudioError(
          "PAYMENT_PENDING",
          "No podemos verificar este recurso de Studio con la cuenta configurada.",
          503,
        );
      return false;
    }
    throw error;
  }
}

export async function dispatchStudioWebhook(
  type: string,
  id: string,
  action: string,
): Promise<boolean> {
  const db = studioDb();
  const key = `${type}:${id}:${action}`;
  const hash = createHash("sha256").update(key).digest("hex");
  // Status is always re-fetched; a payment can change after an earlier notification.
  const event = requireStudioData(
    await db
      .from("studio_payment_events")
      .upsert(
        {
          resource_type: type,
          resource_id: id,
          event_key: key,
          payload_hash: hash,
          status: "processing",
          last_attempt_at: new Date().toISOString(),
        },
        { onConflict: "event_key" },
      )
      .select("id,attempts")
      .single(),
  );
  try {
    const handled = await handleStudioMpResource(type, id);
    await db
      .from("studio_payment_events")
      .update({
        status: handled ? "processed" : "ignored",
        processed_at: new Date().toISOString(),
        attempts: event.attempts + 1,
        error_code: null,
      })
      .eq("id", event.id);
    return handled;
  } catch (error) {
    await db
      .from("studio_payment_events")
      .update({
        status: "failed",
        attempts: event.attempts + 1,
        error_code:
          error instanceof StudioError ? error.code : "PROVIDER_ERROR",
      })
      .eq("id", event.id);
    throw error;
  }
}
