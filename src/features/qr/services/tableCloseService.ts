/**
 * Domain service for manually closing a table order from the admin. The route
 * handler only parses the body and resolves auth; everything in between —
 * validating status, marking the order cancelled with reason, freeing the QR
 * and auditing — lives here.
 */

import type { SupabaseClient } from "@supabase/supabase-js";

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
    .select("id, status, qr_code_id")
    .eq("id", input.orderId)
    .single();

  if (!order) {
    return { ok: false, error: { code: "not_found", message: "Orden no encontrada" } };
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
        actor_type: "user",
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

  const { error: updateError } = await admin
    .from("orders")
    .update({
      status: "cancelled",
      cancel_reason: reasonText,
      closed_by_membership_id: input.membershipId,
      updated_at: now,
    })
    .eq("id", input.orderId);

  if (updateError) {
    return { ok: false, error: { code: "internal", message: updateError.message } };
  }

  if (order.qr_code_id) {
    await admin
      .from("qr_codes")
      .update({ current_order_id: null, updated_at: now })
      .eq("id", order.qr_code_id)
      .eq("current_order_id", input.orderId);
  }

  await admin.from("order_activity_log").insert({
    order_id: input.orderId,
    actor_type: "user",
    actor_id: input.actorUserId,
    actor_label: "personal",
    action: "table.closed_manual",
    payload: {
      reason_code: input.reason,
      reason: reasonText,
    },
  });

  return { ok: true, data: { closedAt: now } };
}
