/**
 * Server-side service for STAFF-initiated orders.
 *
 * A staff member (permission `order.take`) builds an order in the dashboard and
 * confirms it. Two paths:
 *   - link mode: append items to an existing table order (`tableOrderId`)
 *   - counter mode: create a fresh order + a single-use `order` QR ticket the
 *     customer scans to review & pay.
 *
 * Prices are resolved server-side (never trust client). Items are attributed to
 * the staff membership (`added_by_member_id`). Returns a typed ServiceResult so
 * the route stays a thin adapter. Reuses the shared item-row builder.
 */

import type { SupabaseClient } from "@supabase/supabase-js";

import {
  buildOrderItemRows,
  filterValidItems,
  type RequestedItem,
} from "@/features/qr/helpers/buildOrderItemRows";

import type {
  ServiceError,
  ServiceResult,
} from "@/features/qr/services/tablePaymentService";

function err(
  code: ServiceError["code"],
  message: string,
): { ok: false; error: ServiceError } {
  return { ok: false, error: { code, message } };
}

export interface CreateStaffOrderInput {
  tenantId: string;
  /** tenant_memberships.id of the staff — attributes items (added_by_member_id). */
  actorMembershipId: string;
  /** auth user id (profiles.id) — sets orders.created_by (FK → profiles). */
  actorUserId: string;
  items: RequestedItem[];
  customerName?: string | null;
  customerPhone?: string | null;
  /** When present, append to this existing (table) order instead of a new one. */
  tableOrderId?: string | null;
}

export interface CreateStaffOrderResult {
  orderId: string;
  /** Present only in counter mode (a fresh single-use QR was minted). */
  qrToken: string | null;
  total: number;
  linkedToTable: boolean;
}

export async function createStaffOrder(
  admin: SupabaseClient,
  input: CreateStaffOrderInput,
): Promise<ServiceResult<CreateStaffOrderResult>> {
  const valid = filterValidItems(input.items);
  if (valid.length === 0) {
    return err("validation", "Agrega al menos un producto al pedido");
  }

  // Server-side pricing over the tenant's own products (all products, not just
  // public — staff may sell internal items).
  const productIds = valid.map((i) => i.product_id);
  const { data: products } = await admin
    .from("products")
    .select("id, price")
    .eq("tenant_id", input.tenantId)
    .in("id", productIds)
    .is("deleted_at", null);

  const priceByProduct = new Map<string, number>();
  for (const p of products ?? []) priceByProduct.set(p.id, Number(p.price));

  if (input.tableOrderId) {
    return appendToTableOrder(admin, input, valid, priceByProduct);
  }
  return createCounterOrder(admin, input, valid, priceByProduct);
}

/* -------------------------------------------------------------------------- */
/* Counter mode — new order + single-use 'order' QR                            */
/* -------------------------------------------------------------------------- */

async function createCounterOrder(
  admin: SupabaseClient,
  input: CreateStaffOrderInput,
  items: RequestedItem[],
  priceByProduct: Map<string, number>,
): Promise<ServiceResult<CreateStaffOrderResult>> {
  const now = new Date().toISOString();

  const { data: order, error: orderErr } = await admin
    .from("orders")
    .insert({
      tenant_id: input.tenantId,
      status: "draft",
      subtotal: 0,
      total: 0,
      discount: 0,
      source: "staff",
      order_type: "takeaway",
      created_by: input.actorUserId,
      customer_name: input.customerName ?? null,
      customer_phone: input.customerPhone ?? null,
    })
    .select("id")
    .single();

  if (orderErr || !order) {
    return err("internal", orderErr?.message ?? "No se pudo crear el pedido");
  }

  const rows = buildOrderItemRows({
    orderId: order.id,
    items,
    priceByProduct,
    addedByMemberId: input.actorMembershipId,
  });
  if (rows.length === 0) {
    return err("validation", "Ningún producto coincide con el negocio");
  }

  const { error: itemsErr } = await admin.from("order_items").insert(rows);
  if (itemsErr) return err("internal", itemsErr.message);

  const total = rows.reduce((a, r) => a + r.subtotal, 0);
  await admin
    .from("orders")
    .update({
      status: "in_progress",
      // A staff-built counter ticket needs no preparation gate — the staff
      // already assembled it, so it's payable immediately. (Tables gate on
      // per-person readiness; a counter 'order' has no devices/prep step.)
      fulfillment_status: "ready",
      subtotal: total,
      total,
      balance_due: total,
      updated_at: now,
    })
    .eq("id", order.id);

  // Mint a single-use 'order' QR bound to this order, then back-link the order
  // to the QR (qr_code_id) so release-on-pay can archive it.
  const token = crypto.randomUUID().replace(/-/g, "");
  const { data: qr, error: qrErr } = await admin
    .from("qr_codes")
    .insert({
      tenant_id: input.tenantId,
      token,
      kind: "order",
      label: input.customerName?.trim() || "Pedido",
      current_order_id: order.id,
      created_by: input.actorMembershipId,
      is_active: true,
    })
    .select("id, token")
    .single();

  if (qrErr || !qr) {
    return err("internal", qrErr?.message ?? "No se pudo generar el QR");
  }

  await admin
    .from("orders")
    .update({ qr_code_id: qr.id })
    .eq("id", order.id);

  await admin.from("order_activity_log").insert([
    {
      order_id: order.id,
      actor_type: "member",
      actor_id: input.actorMembershipId,
      actor_label: "personal",
      action: "order.created",
      payload: { source: "staff", qr_token: token },
    },
    {
      order_id: order.id,
      actor_type: "member",
      actor_id: input.actorMembershipId,
      actor_label: "personal",
      action: "item.added",
      payload: { count: rows.length, subtotal: total },
    },
  ]);

  return {
    ok: true,
    data: { orderId: order.id, qrToken: token, total, linkedToTable: false },
  };
}

/* -------------------------------------------------------------------------- */
/* Link mode — append to an existing table order                               */
/* -------------------------------------------------------------------------- */

async function appendToTableOrder(
  admin: SupabaseClient,
  input: CreateStaffOrderInput,
  items: RequestedItem[],
  priceByProduct: Map<string, number>,
): Promise<ServiceResult<CreateStaffOrderResult>> {
  const { data: order } = await admin
    .from("orders")
    .select("id, status, subtotal, table_label")
    .eq("id", input.tableOrderId as string)
    .eq("tenant_id", input.tenantId)
    .maybeSingle();

  if (!order) return err("not_found", "Mesa no encontrada");
  if (["pending_payment", "paid", "cancelled"].includes(order.status)) {
    return err("conflict", "La orden ya no acepta nuevos productos");
  }

  const rows = buildOrderItemRows({
    orderId: order.id,
    items,
    priceByProduct,
    addedByMemberId: input.actorMembershipId,
    originTableLabel: order.table_label ?? null,
  });
  if (rows.length === 0) {
    return err("validation", "Ningún producto coincide con el negocio");
  }

  const { error: itemsErr } = await admin.from("order_items").insert(rows);
  if (itemsErr) return err("internal", itemsErr.message);

  const added = rows.reduce((a, r) => a + r.subtotal, 0);
  const nextSubtotal = Number(order.subtotal) + added;
  await admin
    .from("orders")
    .update({
      status: "in_progress",
      subtotal: nextSubtotal,
      total: nextSubtotal,
      balance_due: nextSubtotal,
      updated_at: new Date().toISOString(),
    })
    .eq("id", order.id);

  await admin.from("order_activity_log").insert({
    order_id: order.id,
    actor_type: "member",
    actor_id: input.actorMembershipId,
    actor_label: "personal",
    action: "item.added",
    payload: { count: rows.length, subtotal: added, source: "staff" },
  });

  return {
    ok: true,
    data: {
      orderId: order.id,
      qrToken: null,
      total: nextSubtotal,
      linkedToTable: true,
    },
  };
}
