/**
 * Aggregates everything the admin live-view of a table needs in a single
 * query batch: order header, qr code, devices, items (enriched with product
 * names), split groups and the most recent activity log entries plus any
 * pending payments awaiting validation.
 *
 * Lives as a service so the route can stay thin AND so the future admin
 * pages can reuse the same shape (e.g. for SSR or another component).
 */

import type { SupabaseClient } from "@supabase/supabase-js";

export interface AdminViewOrder {
  id: string;
  status: string;
  fulfillment_status: string;
  subtotal: number;
  total: number;
  paid_total: number;
  balance_due: number;
  payment_method: string | null;
  table_label: string | null;
  created_at: string;
  paid_at: string | null;
  cancel_reason: string | null;
}

export interface AdminViewDevice {
  id: string;
  display_name: string | null;
  color_hex: string;
  joined_at: string;
  last_seen_at: string;
  /** Per-person preparation state: received | in_progress | ready. */
  fulfillment_status: string;
}

export interface AdminViewItem {
  id: string;
  product_id: string;
  product_name: string;
  quantity: number;
  unit_price: number;
  subtotal: number;
  added_by_device_id: string | null;
  is_shared: boolean;
  created_at: string;
}

export interface AdminViewSplitGroup {
  id: string;
  label: string;
  total: number;
  paid_total: number;
  balance_due: number;
  payment_status: string;
  device_id: string | null;
}

export interface AdminViewActivity {
  id: string;
  action: string;
  actor_type: string | null;
  actor_label: string | null;
  actor_id: string | null;
  payload: Record<string, unknown> | null;
  created_at: string;
}

export interface AdminViewPendingPayment {
  id: string;
  order_id: string;
  split_group_id: string | null;
  amount: number;
  status: string;
  method: string;
  created_at: string;
  group_label: string | null;
  device_name: string | null;
}

export interface AdminViewResponse {
  order: AdminViewOrder | null;
  qr_code: { id: string; label: string; table_capacity: number | null; token: string } | null;
  devices: AdminViewDevice[];
  items: AdminViewItem[];
  split_groups: AdminViewSplitGroup[];
  activity_log: AdminViewActivity[];
  pending_payments: AdminViewPendingPayment[];
  /** Labels of the OTHER tables this one is linked with (empty if not linked). */
  linked_tables: string[];
}

export async function getTableAdminView(
  admin: SupabaseClient,
  orderId: string,
): Promise<{
  order: { id: string; tenant_id: string } | null;
  view: AdminViewResponse | null;
}> {
  const { data: order } = await admin
    .from("orders")
    .select(
      "id, tenant_id, status, fulfillment_status, subtotal, total, paid_total, balance_due, payment_method, created_at, paid_at, qr_code_id, table_label, cancel_reason, merge_group_id",
    )
    .eq("id", orderId)
    .single();

  if (!order) return { order: null, view: null };

  // Labels of the other tables this one is linked with (LINK model).
  let linkedTables: string[] = [];
  if (order.merge_group_id) {
    const { data: linked } = await admin
      .from("orders")
      .select("id, table_label")
      .eq("merge_group_id", order.merge_group_id)
      .neq("id", orderId);
    linkedTables = (linked ?? [])
      .map((o) => o.table_label as string | null)
      .filter((l): l is string => !!l);
  }

  const [
    { data: qrCode },
    { data: rawItems },
    { data: devices },
    { data: splitGroups },
    { data: rawLog },
    { data: rawPayments },
  ] = await Promise.all([
    order.qr_code_id
      ? admin
          .from("qr_codes")
          .select("id, label, table_capacity, token")
          .eq("id", order.qr_code_id)
          .maybeSingle()
      : Promise.resolve({ data: null }),
    admin
      .from("order_items")
      .select(
        "id, product_id, quantity, unit_price, subtotal, added_by_device_id, is_shared, created_at",
      )
      .eq("order_id", orderId)
      .order("created_at", { ascending: true }),
    admin
      .from("order_devices")
      .select(
        "id, display_name, color_hex, joined_at, last_seen_at, fulfillment_status",
      )
      .eq("order_id", orderId)
      .order("joined_at", { ascending: true }),
    admin
      .from("order_split_groups")
      .select(
        "id, label, total, paid_total, balance_due, payment_status, device_id",
      )
      .eq("order_id", orderId)
      .order("created_at", { ascending: true }),
    admin
      .from("order_activity_log")
      .select(
        "id, action, actor_type, actor_label, actor_id, payload, created_at",
      )
      .eq("order_id", orderId)
      .order("created_at", { ascending: false })
      .limit(50),
    admin
      .from("payments")
      .select(
        "id, order_id, split_group_id, amount, status, metadata, created_at",
      )
      .eq("order_id", orderId)
      .eq("status", "pending")
      .order("created_at", { ascending: true }),
  ]);

  const productIds = Array.from(
    new Set((rawItems ?? []).map((i) => i.product_id).filter(Boolean)),
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

  const items: AdminViewItem[] = (rawItems ?? []).map((item) => ({
    id: item.id,
    product_id: item.product_id,
    product_name: productNameMap.get(item.product_id) ?? "Producto",
    quantity: Number(item.quantity),
    unit_price: Number(item.unit_price),
    subtotal: Number(item.subtotal),
    added_by_device_id: item.added_by_device_id,
    is_shared: item.is_shared === true,
    created_at: item.created_at,
  }));

  const groupById = new Map(
    (splitGroups ?? []).map((g) => [g.id, g] as const),
  );
  const deviceById = new Map(
    (devices ?? []).map((d) => [d.id, d] as const),
  );

  const pendingPayments: AdminViewPendingPayment[] = (rawPayments ?? []).map(
    (p) => {
      const meta = (p.metadata as Record<string, unknown> | null) ?? {};
      const method = String(meta.method ?? "manual");
      const groupLabel = p.split_group_id
        ? groupById.get(p.split_group_id)?.label ?? null
        : null;
      const deviceId =
        typeof meta.device_id === "string" ? meta.device_id : null;
      const deviceName = deviceId
        ? deviceById.get(deviceId)?.display_name ?? null
        : null;
      return {
        id: p.id,
        order_id: p.order_id,
        split_group_id: p.split_group_id,
        amount: Number(p.amount),
        status: p.status,
        method,
        created_at: p.created_at,
        group_label: groupLabel,
        device_name: deviceName,
      };
    },
  );

  return {
    order: { id: order.id, tenant_id: order.tenant_id },
    view: {
      order: {
        id: order.id,
        status: order.status,
        fulfillment_status: order.fulfillment_status ?? "received",
        subtotal: Number(order.subtotal),
        total: Number(order.total),
        paid_total: Number(order.paid_total ?? 0),
        balance_due: Number(order.balance_due ?? order.total),
        payment_method: order.payment_method,
        table_label: order.table_label,
        created_at: order.created_at,
        paid_at: order.paid_at,
        cancel_reason: order.cancel_reason,
      },
      qr_code: qrCode as AdminViewResponse["qr_code"],
      devices: (devices ?? []).map((d) => ({
        ...d,
        fulfillment_status: d.fulfillment_status ?? "received",
      })),
      items,
      split_groups: splitGroups ?? [],
      activity_log: rawLog ?? [],
      pending_payments: pendingPayments,
      linked_tables: linkedTables,
    },
  };
}
