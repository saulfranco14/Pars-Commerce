/**
 * Domain service for manually closing a table order from the admin. The route
 * handler only parses the body and resolves auth; everything in between —
 * validating status, marking the order cancelled with reason, freeing the QR
 * and auditing — lives here.
 */

import type { SupabaseClient } from "@supabase/supabase-js";

import { releaseTableQrIfPaid } from "@/features/qr/helpers/releaseTableQrIfPaid";
import type { ServiceResult } from "@/features/qr/services/tablePaymentService";

export const VALID_CLOSE_REASONS = [
  "customer_left_unpaid",
  "paid_outside_system",
  "opened_by_mistake",
  "other",
] as const;
export type CloseReason = (typeof VALID_CLOSE_REASONS)[number];

export function isCloseReason(value: unknown): value is CloseReason {
  return (
    typeof value === "string" &&
    (VALID_CLOSE_REASONS as readonly string[]).includes(value)
  );
}

export interface CloseTableInput {
  orderId: string;
  reason: CloseReason;
  reasonDetails?: string;
  actorUserId: string;
  membershipId: string;
}

export async function closeTableOrder(
  admin: SupabaseClient,
  input: CloseTableInput,
): Promise<ServiceResult<{ closedAt: string }>> {
  if (input.reason === "other" && !input.reasonDetails?.trim()) {
    return {
      ok: false,
      error: {
        code: "validation",
        message: "Cuando el motivo es 'Otro' debes describirlo",
      },
    };
  }

  const { data: order } = await admin
    .from("orders")
    .select("id, status, qr_code_id, merge_group_id, total, balance_due")
    .eq("id", input.orderId)
    .single();

  if (!order) {
    return {
      ok: false,
      error: { code: "not_found", message: "Orden no encontrada" },
    };
  }
  if (order.status === "paid") {
    // Order is already paid but the QR may still be stuck pointing to it
    // (e.g., paid before releaseTableQrIfPaid was deployed). Force-release it.
    const now = new Date().toISOString();
    if (order.qr_code_id) {
      await admin
        .from("qr_codes")
        .update({ current_order_id: null, updated_at: now })
        .eq("id", order.qr_code_id)
        .eq("current_order_id", input.orderId);

      await admin.from("order_activity_log").insert({
        order_id: input.orderId,
        actor_type: "member",
        actor_id: input.actorUserId,
        actor_label: "personal",
        action: "table.qr_released_manual",
        payload: { reason: "paid_order_stuck" },
      });
    }
    return { ok: true, data: { closedAt: now } };
  }

  if (order.status === "cancelled") {
    // Also release QR if stuck on a cancelled order
    if (order.qr_code_id) {
      const now = new Date().toISOString();
      await admin
        .from("qr_codes")
        .update({ current_order_id: null, updated_at: now })
        .eq("id", order.qr_code_id)
        .eq("current_order_id", input.orderId);
    }
    return {
      ok: false,
      error: { code: "conflict", message: "Esta orden ya estaba cerrada" },
    };
  }

  const now = new Date().toISOString();
  const reasonText =
    input.reason === "other" ? input.reasonDetails!.trim() : input.reason;

  // Linked tables share one bill, so closing one closes the whole group and
  // frees every QR. Not linked → just this order. Batched: one orders UPDATE,
  // one QR release, one log insert — closing must feel instant to the staff.
  const { data: groupOrders } = order.merge_group_id
    ? await admin
        .from("orders")
        .select("id, total, balance_due")
        .eq("merge_group_id", order.merge_group_id)
    : {
        data: [
          { id: order.id, total: order.total, balance_due: order.balance_due },
        ],
      };

  const targets = groupOrders ?? [
    { id: order.id, total: order.total, balance_due: order.balance_due },
  ];
  const targetIds = targets.map((o) => o.id as string);

  // "Cobré fuera del sistema" means the staff DID receive the money (cash,
  // another app) — unlike the other reasons, this must settle the order as
  // PAID (paid_total/balance_due/payment_method), not just cancel it with a
  // note. Mirrors payFullOrder's settlement shape so reports/dashboards see
  // real revenue instead of a cancelled order with balance_due sitting at
  // its original total forever.
  if (input.reason === "paid_outside_system") {
    for (const t of targets) {
      const amount = Number(t.total ?? 0);
      const { error: updateError } = await admin
        .from("orders")
        .update({
          status: "paid",
          paid_at: now,
          balance_due: 0,
          paid_total: amount,
          payment_method: "efectivo",
          merge_group_id: null,
          updated_at: now,
        })
        .eq("id", t.id as string);
      if (updateError) {
        return {
          ok: false,
          error: { code: "internal", message: updateError.message },
        };
      }

      await admin.from("payments").insert({
        order_id: t.id,
        provider: "manual",
        status: "approved",
        amount,
        payment_kind: "single",
        metadata: { source: "qr_table_close_paid_outside_system" },
      });

      await admin.from("order_activity_log").insert({
        order_id: t.id,
        actor_type: "member",
        actor_id: input.actorUserId,
        actor_label: "personal",
        action: "table.closed_paid_outside_system",
        payload: { amount },
      });

      await releaseTableQrIfPaid(admin, t.id as string);
    }
    return { ok: true, data: { closedAt: now } };
  }

  const { error: updateError } = await admin
    .from("orders")
    .update({
      status: "cancelled",
      cancel_reason: reasonText,
      closed_by_membership_id: input.membershipId,
      merge_group_id: null,
      updated_at: now,
    })
    .in("id", targetIds);
  if (updateError) {
    return {
      ok: false,
      error: { code: "internal", message: updateError.message },
    };
  }

  // Free every QR still pointing at any of the closed orders.
  await admin
    .from("qr_codes")
    .update({ current_order_id: null, updated_at: now })
    .in("current_order_id", targetIds);

  await admin.from("order_activity_log").insert(
    targetIds.map((id) => ({
      order_id: id,
      actor_type: "member",
      actor_id: input.actorUserId,
      actor_label: "personal",
      action: "table.closed_manual",
      payload: { reason_code: input.reason, reason: reasonText },
    })),
  );

  return { ok: true, data: { closedAt: now } };
}
