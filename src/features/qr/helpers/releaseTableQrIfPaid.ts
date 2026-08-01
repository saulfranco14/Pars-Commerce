import type { SupabaseClient } from "@supabase/supabase-js";

import { requiresReadyBeforePayment } from "@/features/qr/helpers/paymentReadiness";

/**
 * Releases every physical table QR still bound to a paid order. A kiosk order
 * can own a single-use receipt ticket AND later occupy a table, therefore the
 * inverse `qr_codes.current_order_id` relation is the source of truth here.
 *
 * Idempotent: repeating it is safe, and a table that already rolled to a new
 * order is never cleared by a previous customer's payment.
 */
export async function releaseTableQrIfPaid(
  admin: SupabaseClient,
  orderId: string,
): Promise<void> {
  const { data: order } = await admin
    .from("orders")
    .select("id, status, source, order_type, fulfillment_status")
    .eq("id", orderId)
    .single();

  if (!order || order.status !== "paid") return;

  // A pay-first ticket remains usable as the customer's tracker until its
  // preparation ends. A linked table remains occupied during that same wait.
  // El origen de kiosko conserva su ticket para seguimiento aun si después se
  // vinculó a una mesa. `order_type` controla cuándo se puede pagar, no si el
  // cliente aún necesita seguir un pedido de autoservicio ya pagado.
  if (
    !requiresReadyBeforePayment(order.source) &&
    (order.fulfillment_status ?? "received") !== "ready"
  ) {
    return;
  }

  const { data: qrCodes } = await admin
    .from("qr_codes")
    .select("id, kind")
    .eq("current_order_id", orderId);
  if (!qrCodes || qrCodes.length === 0) return;

  const ticketIds = qrCodes
    .filter((qr) => qr.kind === "order")
    .map((qr) => qr.id as string);
  const tableIds = qrCodes
    .filter((qr) => qr.kind !== "order")
    .map((qr) => qr.id as string);
  const now = new Date().toISOString();

  await Promise.all([
    ticketIds.length > 0
      ? admin
          .from("qr_codes")
          .update({
            // The ticket becomes read-only but remains the receipt URL.
            current_order_id: orderId,
            is_active: false,
            archived_at: now,
            updated_at: now,
          })
          .in("id", ticketIds)
      : Promise.resolve({ error: null }),
    tableIds.length > 0
      ? admin
          .from("qr_codes")
          .update({ current_order_id: null, updated_at: now })
          .in("id", tableIds)
          .eq("current_order_id", orderId)
      : Promise.resolve({ error: null }),
  ]);

  await admin.from("order_activity_log").insert({
    order_id: orderId,
    actor_type: "system",
    actor_label: "sistema",
    action: "table.closed_automatic",
    payload: { ticket_qr_ids: ticketIds, released_qr_ids: tableIds },
  });
}
