import { NextResponse } from "next/server";

import { createAdminClient } from "@/lib/supabase/admin";
import { getPendingMergeRequests } from "@/features/qr/services/tableMergeRequestService";
import { getGroupOrderIds } from "@/features/qr/services/tableLinkService";

interface RouteContext {
  params: Promise<{ orderId: string }>;
}

export async function GET(request: Request, context: RouteContext) {
  const { orderId } = await context.params;
  const fingerprint = request.headers.get("x-fingerprint-id")?.trim() ?? null;
  const admin = createAdminClient();

  const { data: order } = await admin
    .from("orders")
    .select(
      "id, tenant_id, status, fulfillment_status, total, paid_total, balance_due, created_at, qr_code_id, payment_method, merge_group_id",
    )
    .eq("id", orderId)
    .single();

  if (!order) {
    return NextResponse.json({ error: "Orden no encontrada" }, { status: 404 });
  }

  const { data: tenant } = await admin
    .from("tenants")
    .select("id, name, slug, logo_url")
    .eq("id", order.tenant_id)
    .single();

  // Linked tables share one bill: aggregate items/splits/devices/totals across
  // every order in the merge group (just [orderId] when not linked).
  const groupOrderIds = await getGroupOrderIds(admin, orderId);
  const isLinked = groupOrderIds.length > 1;

  const [{ data: qrCode }, { data: splitGroups }, { data: items }, { data: devices }, { data: groupOrders }] =
    await Promise.all([
      order.qr_code_id
        ? admin
            .from("qr_codes")
            .select("id, label")
            .eq("id", order.qr_code_id)
            .maybeSingle()
        : Promise.resolve({ data: null }),
      admin
        .from("order_split_groups")
        .select(
          "id, label, total, paid_total, balance_due, payment_status, device_id",
        )
        .in("order_id", groupOrderIds)
        .order("created_at", { ascending: true }),
      admin
        .from("order_items")
        .select(
          "id, product_id, quantity, unit_price, subtotal, added_by_device_id, is_shared, origin_table_label, created_at",
        )
        .in("order_id", groupOrderIds)
        .order("created_at", { ascending: true }),
      admin
        .from("order_devices")
        .select(
          "id, display_name, color_hex, joined_at, last_seen_at, fulfillment_status, device_fingerprint",
        )
        .in("order_id", groupOrderIds)
        .order("joined_at", { ascending: true }),
      admin
        .from("orders")
        .select("id, total, paid_total, balance_due, table_label")
        .in("id", groupOrderIds),
    ]);

  // Aggregate totals across the group.
  const groupTotal = (groupOrders ?? []).reduce(
    (a, o) => a + Number(o.total ?? 0),
    0,
  );
  const groupPaid = (groupOrders ?? []).reduce(
    (a, o) => a + Number(o.paid_total ?? 0),
    0,
  );
  const groupBalance = (groupOrders ?? []).reduce(
    (a, o) => a + Number(o.balance_due ?? o.total ?? 0),
    0,
  );
  const linkedLabels = isLinked
    ? (groupOrders ?? [])
        .map((o) => o.table_label as string | null)
        .filter((l): l is string => !!l)
    : [];

  // Fetch product names so the bill can show "1x Encerado" instead of an id.
  const productIds = Array.from(
    new Set((items ?? []).map((i) => i.product_id).filter(Boolean)),
  );
  let productNameMap = new Map<string, string>();
  if (productIds.length > 0) {
    const { data: products } = await admin
      .from("products")
      .select("id, name")
      .in("id", productIds);
    productNameMap = new Map(
      (products ?? []).map((p) => [p.id as string, p.name as string]),
    );
  }

  const enrichedItems = (items ?? []).map((item) => ({
    id: item.id,
    product_id: item.product_id,
    product_name: productNameMap.get(item.product_id) ?? "Producto",
    quantity: Number(item.quantity),
    unit_price: Number(item.unit_price),
    subtotal: Number(item.subtotal),
    added_by_device_id: item.added_by_device_id,
    is_shared: item.is_shared === true,
    origin_table_label: item.origin_table_label ?? null,
    created_at: item.created_at ?? null,
  }));

  const groups =
    splitGroups && splitGroups.length > 0
      ? splitGroups
      : [
          {
            id: `order-${order.id}`,
            label: "Cuenta total",
            total: groupTotal,
            paid_total: groupPaid,
            balance_due: groupBalance,
            payment_status: groupBalance <= 0 ? "paid" : "pending",
            device_id: null,
          },
        ];

  // Resolve current device id from fingerprint so the UI can highlight "tu
  // cuenta", know whether this device is the table's owner (approver), and
  // read THIS person's preparation state (to gate "pagar mi parte").
  let myDeviceId: string | null = null;
  let iAmOwner = false;
  let myFulfillmentStatus = "received";
  if (fingerprint) {
    const mine = (devices ?? []).find(
      (d) => d.device_fingerprint === fingerprint,
    );
    if (mine) {
      myDeviceId = mine.id;
      myFulfillmentStatus = mine.fulfillment_status ?? "received";
      // is_owner isn't in the bulk select; one tiny read only when needed.
      const { data: ownerRow } = await admin
        .from("order_devices")
        .select("is_owner")
        .eq("id", mine.id)
        .maybeSingle();
      iAmOwner = ownerRow?.is_owner === true;
    }
  }

  // Pending merge requests (consent flow) — one read; stale rows expire lazily.
  const nowIso = new Date().toISOString();
  const { incoming, outgoing } = await getPendingMergeRequests(
    admin,
    orderId,
    nowIso,
  );

  // Resolve a friendly label for the OTHER table in each request.
  async function labelForOrder(otherOrderId: string): Promise<string> {
    const { data: o } = await admin
      .from("orders")
      .select("table_label")
      .eq("id", otherOrderId)
      .maybeSingle();
    return (o?.table_label as string | null) ?? "otra mesa";
  }

  const incomingPayload = incoming
    ? {
        id: incoming.id,
        requester_label: await labelForOrder(incoming.requester_order_id),
        expires_at: incoming.expires_at,
      }
    : null;
  const outgoingPayload = outgoing
    ? {
        id: outgoing.id,
        target_label: await labelForOrder(outgoing.target_order_id),
        expires_at: outgoing.expires_at,
      }
    : null;

  // For a linked group, "paid" means the whole group is settled.
  const groupStatus = isLinked
    ? groupBalance <= 0
      ? "paid"
      : order.status === "paid"
        ? "in_progress"
        : order.status
    : order.status;

  return NextResponse.json({
    order: {
      id: order.id,
      status: groupStatus,
      fulfillment_status: order.fulfillment_status ?? "received",
      total: groupTotal,
      paid_total: groupPaid,
      balance_due: groupBalance,
      created_at: order.created_at,
      payment_method: order.payment_method ?? null,
    },
    tenant: tenant ?? null,
    qr_code: qrCode ?? null,
    groups,
    items: enrichedItems,
    // Strip device_fingerprint (identifier) — expose only what the UI renders.
    devices: (devices ?? []).map((d) => ({
      id: d.id,
      display_name: d.display_name,
      color_hex: d.color_hex,
      fulfillment_status: d.fulfillment_status ?? "received",
    })),
    my_device_id: myDeviceId,
    my_fulfillment_status: myFulfillmentStatus,
    i_am_owner: iAmOwner,
    is_linked: isLinked,
    linked_labels: linkedLabels,
    incoming_merge_request: incomingPayload,
    outgoing_merge_request: outgoingPayload,
  });
}
