/**
 * Webhook side of the MercadoPago integration for table orders.
 * Given an MP payment that came back as `approved`, settles either the full
 * order (qr_table prefix) or a single split group (qr_table_group prefix).
 * Wrapped as a service so the central /api/mercadopago/webhook route can stay
 * thin and just dispatch by external_reference prefix.
 */

import type { SupabaseClient } from "@supabase/supabase-js";

import { releaseTableQrIfPaid } from "@/features/qr/helpers/releaseTableQrIfPaid";
import { syncSplitOrderPaymentTotals } from "@/features/qr/services/tablePaymentService";

export const QR_TABLE_PREFIX = "qr_table:";
export const QR_TABLE_GROUP_PREFIX = "qr_table_group:";
export const QR_TIP_PREFIX = "qr_tip:";
/** One Mercado Pago checkout that contains both the bill and a tip. */
export const QR_TABLE_PAYMENT_PREFIX = "qr_table_payment:";

export function isQrTableReference(ref: string): boolean {
  return (
    ref.startsWith(QR_TABLE_PREFIX) || ref.startsWith(QR_TABLE_GROUP_PREFIX)
    || ref.startsWith(QR_TIP_PREFIX) || ref.startsWith(QR_TABLE_PAYMENT_PREFIX)
  );
}

interface HandleArgs {
  admin: SupabaseClient;
  externalReference: string;
  mpPaymentId: string;
  amount: number;
  feeAmount?: number;
}

export async function handleQrTableMpPayment({
  admin,
  externalReference,
  mpPaymentId,
  amount,
  feeAmount,
}: HandleArgs) {
  const now = new Date().toISOString();

  if (externalReference.startsWith(QR_TABLE_PAYMENT_PREFIX)) {
    const match = new RegExp(
      `^${QR_TABLE_PAYMENT_PREFIX}(full|group):([0-9a-f-]{36}):(\\d+)$`,
      "i",
    ).exec(externalReference);
    if (!match) {
      console.error("qr_table webhook: invalid combined payment reference", externalReference);
      return;
    }
    const [, scope, entityId, tipCents] = match;
    const tipAmount = Number(tipCents) / 100;
    if (scope === "group") {
      await settleSplitGroup(admin, {
        groupId: entityId,
        mpPaymentId,
        amount,
        tipAmount,
        feeAmount,
        now,
      });
    } else {
      await settleFullOrder(admin, {
        orderId: entityId,
        mpPaymentId,
        amount,
        tipAmount,
        feeAmount,
        now,
      });
    }
    return;
  }

  if (externalReference.startsWith(QR_TIP_PREFIX)) {
    const paymentId = externalReference.slice(QR_TIP_PREFIX.length);
    const fee = Math.max(0, Number(feeAmount ?? 0));
    await admin.from("payments").update({
      status: "approved", external_id: mpPaymentId,
      processing_fee_amount: fee, tip_fee_amount: fee,
      tip_net_amount: Math.max(0, Number(amount) - fee), updated_at: now,
    } as never).eq("id", paymentId);
    return;
  }

  if (externalReference.startsWith(QR_TABLE_GROUP_PREFIX)) {
    const groupId = externalReference.slice(QR_TABLE_GROUP_PREFIX.length);
    await settleSplitGroup(admin, { groupId, mpPaymentId, amount, now });
    return;
  }

  const orderId = externalReference.slice(QR_TABLE_PREFIX.length);
  await settleFullOrder(admin, { orderId, mpPaymentId, amount, now });
}

async function settleFullOrder(
  admin: SupabaseClient,
  args: {
    orderId: string;
    mpPaymentId: string;
    amount: number;
    tipAmount?: number;
    feeAmount?: number;
    now: string;
  },
) {
  const { data: order } = await admin
    .from("orders")
    .select("id, status, total, assigned_to")
    .eq("id", args.orderId)
    .single();

  if (!order) return;
  if (order.status === "paid") return;

  await admin
    .from("orders")
    .update({
      status: "paid",
      paid_at: args.now,
      balance_due: 0,
      paid_total: Number(order.total),
      payment_method: "mercadopago",
      updated_at: args.now,
    })
    .eq("id", order.id);

  const tipAmount = Math.max(0, Number(args.tipAmount ?? 0));
  const collectedAmount = Math.max(0, Number(args.amount));
  const feeAmount = Math.max(0, Number(args.feeAmount ?? 0));
  const tipFeeAmount = collectedAmount > 0
    ? Math.round((feeAmount * tipAmount / collectedAmount) * 100) / 100
    : 0;
  const { error: payErr } = await admin.from("payments").insert({
    order_id: order.id,
    provider: "mercadopago",
    external_id: args.mpPaymentId,
    status: "approved",
    // `amount` is strictly the order payment. The collected transaction can
    // include a tip, but sales/commissions must never include it.
    amount: Number(order.total),
    tip_amount: tipAmount,
    tip_recipient_user_id: tipAmount > 0 ? order.assigned_to : null,
    processing_fee_amount: feeAmount,
    tip_fee_amount: tipFeeAmount,
    tip_net_amount: Math.max(0, tipAmount - tipFeeAmount),
    payment_kind: "single",
    metadata: { source: "qr_table_mp_webhook", collected_amount: collectedAmount },
  } as never);
  if (payErr && payErr.code !== "23505") {
    console.error("qr_table webhook: payment insert failed", payErr);
  }

  await admin.from("order_activity_log").insert({
    order_id: order.id,
    actor_type: "system",
    actor_label: "mercadopago",
    action: "payment.succeeded",
    payload: {
      method: "mercadopago",
      amount: Number(order.total),
      tip_amount: tipAmount,
      kind: "full",
      mp_payment_id: args.mpPaymentId,
    },
  });

  await releaseTableQrIfPaid(admin, order.id);
}

async function settleSplitGroup(
  admin: SupabaseClient,
  args: {
    groupId: string;
    mpPaymentId: string;
    amount: number;
    tipAmount?: number;
    feeAmount?: number;
    now: string;
  },
) {
  const { data: group } = await admin
    .from("order_split_groups")
    .select("id, order_id, total, payment_status")
    .eq("id", args.groupId)
    .single();

  if (!group) return;
  if (group.payment_status === "paid") return;

  await admin
    .from("order_split_groups")
    .update({
      paid_total: Number(group.total),
      balance_due: 0,
      payment_status: "paid",
      updated_at: args.now,
    })
    .eq("id", args.groupId);

  // See settleFullOrder: external_id + the unique index give idempotency
  // against re-delivered webhooks; swallow 23505, log anything else.
  const tipAmount = Math.max(0, Number(args.tipAmount ?? 0));
  const collectedAmount = Math.max(0, Number(args.amount));
  const feeAmount = Math.max(0, Number(args.feeAmount ?? 0));
  const tipFeeAmount = collectedAmount > 0
    ? Math.round((feeAmount * tipAmount / collectedAmount) * 100) / 100
    : 0;
  const { data: recipientOrder } = tipAmount > 0
    ? await admin.from("orders").select("assigned_to").eq("id", group.order_id).maybeSingle()
    : { data: null };
  const recipient = recipientOrder?.assigned_to ?? null;
  const { error: payErr } = await admin.from("payments").insert({
    order_id: group.order_id,
    provider: "mercadopago",
    external_id: args.mpPaymentId,
    status: "approved",
    amount: Number(group.total),
    tip_amount: tipAmount,
    tip_recipient_user_id: tipAmount > 0 ? recipient : null,
    processing_fee_amount: feeAmount,
    tip_fee_amount: tipFeeAmount,
    tip_net_amount: Math.max(0, tipAmount - tipFeeAmount),
    payment_kind: "partial",
    split_group_id: args.groupId,
    metadata: { source: "qr_table_mp_webhook", collected_amount: collectedAmount },
  } as never);
  if (payErr && payErr.code !== "23505") {
    console.error("qr_table webhook: split payment insert failed", payErr);
  }

  // Reuse the hardened helper (treats a failed/empty read as "not all paid")
  // instead of the old inline `(allGroups ?? []).every(...)`, which marked the
  // order paid whenever the query failed — the money-path bug fixed in
  // tablePaymentService.
  const { allPaid } = await syncSplitOrderPaymentTotals(
    admin,
    group.order_id,
    { now: args.now, method: "mercadopago" },
  );

  await admin.from("order_activity_log").insert({
    order_id: group.order_id,
    actor_type: "system",
    actor_label: "mercadopago",
    action: "payment.succeeded",
    payload: {
      split_group_id: args.groupId,
      method: "mercadopago",
      amount: Number(group.total),
      tip_amount: tipAmount,
      mp_payment_id: args.mpPaymentId,
    },
  });

  if (allPaid) {
    await releaseTableQrIfPaid(admin, group.order_id);
  }
}
