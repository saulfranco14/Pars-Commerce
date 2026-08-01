import { NextResponse } from "next/server";

import { createAdminClient } from "@/lib/supabase/admin";
import { getPendingMergeRequests } from "@/features/qr/services/tableMergeRequestService";

/**
 * Lightweight READ-ONLY heartbeat for the customer's mesa screen. The full
 * `/api/qr/resolve` loads tenant + whole menu + categories and CREATES orders
 * and device rows — far too heavy (and side-effectful) to poll. This endpoint
 * answers only what changes while sitting at the table:
 *
 *   - is the ticket still active for the screen that opened it?
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

  // Both 'table' and single-use 'order' tickets carry a live order to poll.
  const { data: qrCode } = await admin
    .from("qr_codes")
    .select("id, current_order_id, kind, is_active, archived_at")
    .eq("token", token)
    .in("kind", ["table", "order"])
    .maybeSingle();

  if (!qrCode) {
    return NextResponse.json({ error: "QR no encontrado" }, { status: 404 });
  }
  if (
    qrCode.kind !== "order" &&
    (qrCode.is_active !== true || qrCode.archived_at !== null)
  ) {
    return NextResponse.json({ error: "QR no encontrado" }, { status: 404 });
  }

  const orderId = qrCode.current_order_id as string | null;
  if (!orderId) {
    return NextResponse.json({ active: false });
  }

  const { data: order } = await admin
    .from("orders")
    .select("id, status, fulfillment_status, source, total")
    .eq("id", orderId)
    .single();

  // A single-use ticket only needs preparation progress. Keep this hot path at
  // two small reads (QR + order): no device counts or merge queries. Payment
  // may happen before preparation, so a paid ticket remains live until the
  // customer has seen the final preparation state.
  if (qrCode.kind === "order" && order) {
    const fulfillmentStatus = order.fulfillment_status ?? "received";
    const paymentCompleted = ["paid", "completed"].includes(order.status);
    const trackingFulfillment =
      order.status !== "cancelled" &&
      !(paymentCompleted && fulfillmentStatus === "ready");
    return NextResponse.json({
      // `active` means the QR view must keep tracking this ticket; it does NOT
      // mean the payment is pending. The explicit fields below make that
      // distinction available to clients and to operational diagnostics.
      active: trackingFulfillment,
      payment_completed: paymentCompleted,
      tracking_fulfillment: trackingFulfillment,
      order: {
        id: order.id,
        status: order.status,
        fulfillment_status: fulfillmentStatus,
        total: Number(order.total ?? 0),
      },
    });
  }

  const kioskPaymentStillPreparing =
    order?.source === "kiosk" &&
    order.status === "paid" &&
    (order.fulfillment_status ?? "received") !== "ready";
  if (
    !order ||
    (order.status === "cancelled" ||
      (order.status === "paid" && !kioskPaymentStillPreparing))
  ) {
    return NextResponse.json({ active: false, order: order ?? null });
  }

  // Everything below only depends on `orderId` — none of these five reads
  // depend on each other's result, so they all go in one Promise.all instead
  // of paying their latency one after another. (Previously the 3 counts were
  // already parallel, but devices and the merge-request lookup each waited
  // for the previous step to finish first for no real reason.)
  //
  // How many line items exist right now, and how many are ready/received.
  // The customer screen compares ALL of these to what it last rendered:
  // itemCount alone misses a per-LINE transition that doesn't change the
  // order-level summary — e.g. a second line moving received -> in_progress
  // while a first line is ALREADY in_progress. The order-level summary
  // doesn't change (was already in_progress), ready_item_count doesn't
  // change (still zero), so that transition would go undetected with only
  // those two signals. received_item_count catches it: any line leaving
  // "received" changes this count regardless of which status it moves to.
  // `head: true` = count only, zero rows transferred either way.
  const nowIso = new Date().toISOString();
  const [
    { count: itemCount },
    { count: readyItemCount },
    { count: receivedItemCount },
    { data: devices },
    { incoming, outgoing },
  ] = await Promise.all([
    admin
      .from("order_items")
      .select("id", { count: "exact", head: true })
      .eq("order_id", orderId),
    admin
      .from("order_items")
      .select("id", { count: "exact", head: true })
      .eq("order_id", orderId)
      .eq("fulfillment_status", "ready"),
    admin
      .from("order_items")
      .select("id", { count: "exact", head: true })
      .eq("order_id", orderId)
      .eq("fulfillment_status", "received"),
    // One devices read → connected count, whether the caller is the owner,
    // and the caller's own preparation state (per-person "ya puedes pagar").
    admin
      .from("order_devices")
      .select("id, device_fingerprint, is_owner, fulfillment_status")
      .eq("order_id", orderId),
    getPendingMergeRequests(admin, orderId, nowIso),
  ]);
  const myDevice = fingerprint
    ? (devices ?? []).find((d) => d.device_fingerprint === fingerprint)
    : undefined;

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
      /** How many lines are "ready" right now — detects per-line progress
       *  even when the order-level summary hasn't caught up (other lines
       *  still in_progress). */
      ready_item_count: readyItemCount ?? 0,
      /** How many lines are still "received" (untouched) — combined with
       *  ready_item_count, detects ANY per-line transition, including
       *  received -> in_progress when another line is already in_progress
       *  (a change ready_item_count alone can't see). */
      received_item_count: receivedItemCount ?? 0,
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
