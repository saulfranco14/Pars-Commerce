/**
 * Webhook side of the MercadoPago integration for table orders.
 * Given an MP payment that came back as `approved`, settles either the full
 * order (qr_table prefix) or a single split group (qr_table_group prefix).
 * Wrapped as a service so the central /api/mercadopago/webhook route can stay
 * thin and just dispatch by external_reference prefix.
 */

import type { SupabaseClient } from "@supabase/supabase-js";

import { releaseTableQrIfPaid } from "@/features/qr/helpers/releaseTableQrIfPaid";
import { areAllSplitGroupsPaid } from "@/features/qr/services/tablePaymentService";

export const QR_TABLE_PREFIX = "qr_table:";
export const QR_TABLE_GROUP_PREFIX = "qr_table_group:";

export function isQrTableReference(ref: string): boolean {
  return (
    ref.startsWith(QR_TABLE_PREFIX) || ref.startsWith(QR_TABLE_GROUP_PREFIX)
  );
}

interface HandleArgs {
  admin: SupabaseClient;
  externalReference: string;
  mpPaymentId: string;
  amount: number;
}

export async function handleQrTableMpPayment({
  admin,
  externalReference,
  mpPaymentId,
  amount,
}: HandleArgs) {
  const now = new Date().toISOString();

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
    now: string;
  },
) {
  const { data: order } = await admin
    .from("orders")
    .select("id, status, total")
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

  const { error: payErr } = await admin.from("payments").insert({
    order_id: order.id,
    provider: "mercadopago",
    external_id: args.mpPaymentId,
    status: "approved",
    amount: args.amount,
    payment_kind: "single",
    metadata: { source: "qr_table_mp_webhook" },
  });
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
      amount: args.amount,
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
  const { error: payErr } = await admin.from("payments").insert({
    order_id: group.order_id,
    provider: "mercadopago",
    external_id: args.mpPaymentId,
    status: "approved",
    amount: args.amount,
    payment_kind: "partial",
    split_group_id: args.groupId,
    metadata: { source: "qr_table_mp_webhook" },
  });
  if (payErr && payErr.code !== "23505") {
    console.error("qr_table webhook: split payment insert failed", payErr);
  }

  // Reuse the hardened helper (treats a failed/empty read as "not all paid")
  // instead of the old inline `(allGroups ?? []).every(...)`, which marked the
  // order paid whenever the query failed — the money-path bug fixed in
  // tablePaymentService.
  const allPaid = await areAllSplitGroupsPaid(admin, group.order_id);

  if (allPaid) {
    await admin
      .from("orders")
      .update({
        status: "paid",
        paid_at: args.now,
        balance_due: 0,
        paid_total: Number(group.total),
        payment_method: "mercadopago",
        updated_at: args.now,
      })
      .eq("id", group.order_id);
  }

  await admin.from("order_activity_log").insert({
    order_id: group.order_id,
    actor_type: "system",
    actor_label: "mercadopago",
    action: "payment.succeeded",
    payload: {
      split_group_id: args.groupId,
      method: "mercadopago",
      amount: args.amount,
      mp_payment_id: args.mpPaymentId,
    },
  });

  if (allPaid) {
    await releaseTableQrIfPaid(admin, group.order_id);
  }
}
