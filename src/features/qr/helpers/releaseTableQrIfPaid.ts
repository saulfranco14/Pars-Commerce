import type { SupabaseClient } from "@supabase/supabase-js";

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
    .select("id, status, qr_code_id, order_type")
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

  const now = new Date().toISOString();
  // A single-use 'order' ticket is spent once paid → archive it so it can't be
  // rescanned. A persistent 'table'/'payment' QR just frees up for the next use.
  const isSingleUse = qr.kind === "order";
  await admin
    .from("qr_codes")
    .update({
      current_order_id: null,
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
