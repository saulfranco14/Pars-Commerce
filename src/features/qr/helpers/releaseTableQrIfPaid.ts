import type { SupabaseClient } from "@supabase/supabase-js";

import { requiresReadyBeforePayment } from "@/features/qr/helpers/paymentReadiness";

/**
 * If the order is fully paid, clear qr_codes.current_order_id so the table
 * becomes free again automatically. Logs `table.closed_automatic` to the
 * activity log so the admin can audit it later.
 *
 * Idempotent: safe to call multiple times, no-op if order isn't paid yet.
 */
export async function releaseTableQrIfPaid(
  admin: SupabaseClient,
  orderId: string,
): Promise<void> {
  const { data: order } = await admin
    .from("orders")
    .select("id, status, qr_code_id, order_type, source, fulfillment_status")
    .eq("id", orderId)
    .single();

  if (!order || order.status !== "paid") return;
  if (!order.qr_code_id) return;

  // Only release the QR if it's still pointing at this order (avoid races
  // where the QR was already linked to a brand-new order).
  const { data: qr } = await admin
    .from("qr_codes")
    .select("id, current_order_id, kind")
    .eq("id", order.qr_code_id)
    .single();

  if (!qr || qr.current_order_id !== orderId) return;

  const isSingleUse = qr.kind === "order";

  // Un ticket que se paga POR ADELANTADO no se gasta al cobrar: es la única
  // pantalla donde el cliente sigue su pedido, y archivarla ahí lo dejaba con un
  // QR muerto. Se gasta cuando el trabajo queda listo, que es cuando ya recogió.
  if (
    isSingleUse &&
    !requiresReadyBeforePayment(order.source) &&
    (order.fulfillment_status ?? "received") !== "ready"
  ) {
    return;
  }

  const now = new Date().toISOString();
  // A single-use 'order' ticket is spent once paid → archive it so it can't be
  // rescanned. A persistent 'table'/'payment' QR just frees up for the next use.
  await admin
    .from("qr_codes")
    .update({
      // Single-use tickets become read-only but keep the order pointer so the
      // same unguessable token can reopen its historical receipt.
      current_order_id: isSingleUse ? orderId : null,
      updated_at: now,
      ...(isSingleUse ? { is_active: false, archived_at: now } : {}),
    })
    .eq("id", order.qr_code_id);

  await admin.from("order_activity_log").insert({
    order_id: orderId,
    actor_type: "system",
    actor_label: "sistema",
    action: "table.closed_automatic",
    payload: { qr_code_id: order.qr_code_id },
  });
}
