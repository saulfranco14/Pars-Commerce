import { NextResponse } from "next/server";

import { createAdminClient } from "@/lib/supabase/admin";
import { getPendingMergeRequests } from "@/features/qr/services/tableMergeRequestService";

/**
 * Lightweight READ-ONLY heartbeat for the customer's mesa screen. The full
 * `/api/qr/resolve` loads tenant + whole menu + categories and CREATES orders
 * and device rows — far too heavy (and side-effectful) to poll. This endpoint
 * answers only what changes while sitting at the table:
 *
 *   - is the order still active? (paid / cancelled / gone → `active: false`)
 *   - how many people are connected, and am I the responsible?
 *   - is there a pending merge invite (incoming/outgoing)?
 *
 * ~4 small reads, zero writes on the hot path (expiry flips are conditional),
 * tiny payload. Clients poll THIS, and only re-run the full resolve when the
 * pulse says the order changed.
 */
export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const token = (searchParams.get("token") ?? "").trim();
  const fingerprint = request.headers.get("x-fingerprint-id")?.trim() ?? null;

  if (!token) {
    return NextResponse.json({ error: "token is required" }, { status: 400 });
  }

  const admin = createAdminClient();

  const { data: qrCode } = await admin
    .from("qr_codes")
    .select("id, current_order_id")
    .eq("token", token)
    .eq("kind", "table")
    .is("archived_at", null)
    .eq("is_active", true)
    .single();

  if (!qrCode) {
    return NextResponse.json({ error: "QR no encontrado" }, { status: 404 });
  }

  const orderId = qrCode.current_order_id as string | null;
  if (!orderId) {
    return NextResponse.json({ active: false });
  }

  const { data: order } = await admin
    .from("orders")
    .select("id, status, fulfillment_status, total")
    .eq("id", orderId)
    .single();

  if (!order || ["paid", "cancelled"].includes(order.status)) {
    return NextResponse.json({ active: false, order: order ?? null });
  }

  // How many line items exist right now. The customer screen compares this to
  // what it last rendered to detect a NEW batch (another person ordered, or a
  // second round from the same person) and refresh the tracker without a full
  // resolve. `head: true` = count only, zero rows transferred.
  const { count: itemCount } = await admin
    .from("order_items")
    .select("id", { count: "exact", head: true })
    .eq("order_id", orderId);

  // One devices read → connected count, whether the caller is the owner, and
  // the caller's own preparation state (per-person "ya puedes pagar").
  const { data: devices } = await admin
    .from("order_devices")
    .select("id, device_fingerprint, is_owner, fulfillment_status")
    .eq("order_id", orderId);
  const myDevice = fingerprint
    ? (devices ?? []).find((d) => d.device_fingerprint === fingerprint)
    : undefined;

  const nowIso = new Date().toISOString();
  const { incoming, outgoing } = await getPendingMergeRequests(
    admin,
    orderId,
    nowIso,
  );

  // One labels read for whichever "other tables" the requests reference.
  const otherOrderIds = [
    incoming?.requester_order_id,
    outgoing?.target_order_id,
  ].filter((id): id is string => !!id);
  const labelByOrder = new Map<string, string>();
  if (otherOrderIds.length > 0) {
    const { data: others } = await admin
      .from("orders")
      .select("id, table_label")
      .in("id", otherOrderIds);
    for (const o of others ?? []) {
      labelByOrder.set(o.id as string, (o.table_label as string) ?? "otra mesa");
    }
  }

  return NextResponse.json({
    active: true,
    order: {
      id: order.id,
      status: order.status,
      // Order-level summary (derived from all people).
      fulfillment_status: order.fulfillment_status ?? "received",
      // This caller's OWN state — what actually gates "ya puedes pagar" for them.
      my_fulfillment_status: myDevice?.fulfillment_status ?? "received",
      total: Number(order.total ?? 0),
      item_count: itemCount ?? 0,
    },
    connected_devices: (devices ?? []).length,
    i_am_owner: myDevice?.is_owner === true,
    incoming_merge_request: incoming
      ? {
          id: incoming.id,
          requester_label:
            labelByOrder.get(incoming.requester_order_id) ?? "otra mesa",
          expires_at: incoming.expires_at,
        }
      : null,
    outgoing_merge_request: outgoing
      ? {
          id: outgoing.id,
          target_label:
            labelByOrder.get(outgoing.target_order_id) ?? "otra mesa",
          expires_at: outgoing.expires_at,
        }
      : null,
  });
}
