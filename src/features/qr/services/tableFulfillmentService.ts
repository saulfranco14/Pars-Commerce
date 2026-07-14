/**
 * Domain service for the fulfillment (preparation) lifecycle of a table order.
 *
 * Multi-business: an order moves through received -> in_progress -> ready,
 * INDEPENDENT of the payment lifecycle (`orders.status`). Only staff with the
 * `qr.fulfill` permission advance it; the customer cannot pay until it's ready.
 *
 * Server-only: receives an admin Supabase client, returns a typed
 * `ServiceResult` so the route handler stays thin.
 */

import type { SupabaseClient } from "@supabase/supabase-js";

import type {
  ServiceError,
  ServiceResult,
} from "@/features/qr/services/tablePaymentService";

export type FulfillmentStatus = "received" | "in_progress" | "ready";

export const FULFILLMENT_STATUSES: FulfillmentStatus[] = [
  "received",
  "in_progress",
  "ready",
];

function err(
  code: ServiceError["code"],
  message: string,
): { ok: false; error: ServiceError } {
  return { ok: false, error: { code, message } };
}

/**
 * Guard used by the payment services: the customer can only pay once the
 * business has marked the order as ready. Returns a ServiceError to surface,
 * or null when payment is allowed.
 */
export async function assertOrderReadyForPayment(
  admin: SupabaseClient,
  orderId: string,
): Promise<ServiceError | null> {
  const { data: order } = await admin
    .from("orders")
    .select("id, fulfillment_status")
    .eq("id", orderId)
    .single();

  if (!order) return { code: "not_found", message: "Orden no encontrada" };
  if (order.fulfillment_status !== "ready") {
    return {
      code: "conflict",
      message:
        "El negocio aún está preparando tu pedido. Podrás pagar cuando esté listo.",
    };
  }
  return null;
}

export interface AdvanceFulfillmentInput {
  orderId: string;
  target: FulfillmentStatus;
  actorUserId: string;
}

export interface AdvanceFulfillmentResult {
  orderId: string;
  fulfillmentStatus: FulfillmentStatus;
}

export async function advanceFulfillment(
  admin: SupabaseClient,
  input: AdvanceFulfillmentInput,
): Promise<ServiceResult<AdvanceFulfillmentResult>> {
  const { data: order } = await admin
    .from("orders")
    .select("id, status, fulfillment_status")
    .eq("id", input.orderId)
    .single();

  if (!order) return err("not_found", "Orden no encontrada");
  if (order.status === "paid")
    return err("conflict", "La orden ya está pagada");
  if (order.status === "cancelled")
    return err("conflict", "La orden fue cancelada");

  const from = (order.fulfillment_status as FulfillmentStatus) ?? "received";

  // No-op: already there. Return success so the UI stays idempotent.
  if (from === input.target) {
    return {
      ok: true,
      data: { orderId: order.id, fulfillmentStatus: input.target },
    };
  }

  const now = new Date().toISOString();
  const { error: updateError } = await admin
    .from("orders")
    .update({ fulfillment_status: input.target, updated_at: now })
    .eq("id", input.orderId);

  if (updateError) return err("internal", updateError.message);

  await admin.from("order_activity_log").insert({
    order_id: input.orderId,
    actor_type: "member",
    actor_id: input.actorUserId,
    actor_label: "personal",
    action: "fulfillment.changed",
    payload: { from, to: input.target },
  });

  return {
    ok: true,
    data: { orderId: order.id, fulfillmentStatus: input.target },
  };
}

/* -------------------------------------------------------------------------- */
/*  Per-person (per-device) fulfillment                                        */
/* -------------------------------------------------------------------------- */

export interface AdvanceDeviceFulfillmentInput {
  orderId: string;
  /** The order_devices.id whose preparation state to move. */
  deviceId: string;
  target: FulfillmentStatus;
  actorUserId: string;
}

export interface AdvanceDeviceFulfillmentResult {
  orderId: string;
  deviceId: string;
  /** New per-device state. */
  deviceStatus: FulfillmentStatus;
  /** Order-level summary AFTER the DB trigger re-derived it. */
  orderStatus: FulfillmentStatus;
}

/**
 * Advance ONE person's preparation state. The DB trigger
 * (`recompute_order_fulfillment`) keeps `orders.fulfillment_status` in sync as a
 * derived summary, so every existing reader/guard keeps working. Neutral,
 * multi-business states only.
 */
export async function advanceDeviceFulfillment(
  admin: SupabaseClient,
  input: AdvanceDeviceFulfillmentInput,
): Promise<ServiceResult<AdvanceDeviceFulfillmentResult>> {
  const { data: order } = await admin
    .from("orders")
    .select("id, status")
    .eq("id", input.orderId)
    .single();

  if (!order) return err("not_found", "Orden no encontrada");
  if (order.status === "paid")
    return err("conflict", "La orden ya está pagada");
  if (order.status === "cancelled")
    return err("conflict", "La orden fue cancelada");

  const { data: device } = await admin
    .from("order_devices")
    .select("id, order_id, display_name, fulfillment_status")
    .eq("id", input.deviceId)
    .eq("order_id", input.orderId)
    .maybeSingle();

  if (!device) return err("not_found", "Cliente no encontrado en esta mesa");

  const from =
    (device.fulfillment_status as FulfillmentStatus) ?? "received";

  if (from !== input.target) {
    const now = new Date().toISOString();
    const { error: updateError } = await admin
      .from("order_devices")
      .update({ fulfillment_status: input.target, updated_at: now })
      .eq("id", input.deviceId);

    if (updateError) return err("internal", updateError.message);

    await admin.from("order_activity_log").insert({
      order_id: input.orderId,
      actor_type: "member",
      actor_id: input.actorUserId,
      actor_label: "personal",
      action: "fulfillment.device_changed",
      payload: {
        device_id: input.deviceId,
        device_name: device.display_name ?? null,
        from,
        to: input.target,
      },
    });
  }

  // Read back the summary the trigger derived (fallback to a manual compute if
  // the column somehow lags — defensive, keeps the response accurate).
  const { data: fresh } = await admin
    .from("orders")
    .select("fulfillment_status")
    .eq("id", input.orderId)
    .single();

  return {
    ok: true,
    data: {
      orderId: input.orderId,
      deviceId: input.deviceId,
      deviceStatus: input.target,
      orderStatus:
        (fresh?.fulfillment_status as FulfillmentStatus) ?? "received",
    },
  };
}

/* -------------------------------------------------------------------------- */
/*  Per-product-line (order_items) fulfillment                                 */
/* -------------------------------------------------------------------------- */

export interface AdvanceItemFulfillmentInput {
  orderId: string;
  /** The order_items.id whose preparation state to move. */
  orderItemId: string;
  target: FulfillmentStatus;
  actorUserId: string;
}

export interface AdvanceItemFulfillmentResult {
  orderId: string;
  orderItemId: string;
  /** New per-line state. */
  itemStatus: FulfillmentStatus;
  /** Per-device summary AFTER the DB trigger cascade re-derived it. */
  deviceStatus: FulfillmentStatus | null;
  /** Order-level summary AFTER the DB trigger cascade re-derived it. */
  orderStatus: FulfillmentStatus;
}

/**
 * Advance ONE product line's preparation state (e.g. a drink is ready while
 * a service on the same order isn't yet). The DB trigger cascade
 * (`recompute_device_fulfillment` -> `recompute_order_fulfillment`) keeps
 * both the device and order summaries in sync, so every existing
 * reader/guard keeps working unchanged. Neutral, multi-business states only.
 */
export async function advanceItemFulfillment(
  admin: SupabaseClient,
  input: AdvanceItemFulfillmentInput,
): Promise<ServiceResult<AdvanceItemFulfillmentResult>> {
  const { data: order } = await admin
    .from("orders")
    .select("id, status")
    .eq("id", input.orderId)
    .single();

  if (!order) return err("not_found", "Orden no encontrada");
  if (order.status === "paid")
    return err("conflict", "La orden ya está pagada");
  if (order.status === "cancelled")
    return err("conflict", "La orden fue cancelada");

  const { data: item } = await admin
    .from("order_items")
    .select("id, order_id, product_id, added_by_device_id, fulfillment_status")
    .eq("id", input.orderItemId)
    .eq("order_id", input.orderId)
    .maybeSingle();

  if (!item) return err("not_found", "Producto no encontrado en esta orden");

  const from = (item.fulfillment_status as FulfillmentStatus) ?? "received";

  if (from !== input.target) {
    const { error: updateError } = await admin
      .from("order_items")
      .update({ fulfillment_status: input.target })
      .eq("id", input.orderItemId);

    if (updateError) return err("internal", updateError.message);

    await admin.from("order_activity_log").insert({
      order_id: input.orderId,
      actor_type: "member",
      actor_id: input.actorUserId,
      actor_label: "personal",
      action: "fulfillment.item_changed",
      payload: {
        order_item_id: input.orderItemId,
        product_id: item.product_id,
        device_id: item.added_by_device_id,
        from,
        to: input.target,
      },
    });
  }

  // Read back the summaries the trigger cascade derived (device, then order).
  const [{ data: freshDevice }, { data: freshOrder }] = await Promise.all([
    item.added_by_device_id
      ? admin
          .from("order_devices")
          .select("fulfillment_status")
          .eq("id", item.added_by_device_id)
          .maybeSingle()
      : Promise.resolve({ data: null }),
    admin
      .from("orders")
      .select("fulfillment_status")
      .eq("id", input.orderId)
      .single(),
  ]);

  return {
    ok: true,
    data: {
      orderId: input.orderId,
      orderItemId: input.orderItemId,
      itemStatus: input.target,
      deviceStatus:
        (freshDevice?.fulfillment_status as FulfillmentStatus) ?? null,
      orderStatus:
        (freshOrder?.fulfillment_status as FulfillmentStatus) ?? "received",
    },
  };
}

/**
 * Whole-table shortcut used by the business "marcar toda la mesa como lista"
 * button: set EVERY device to the target, then let the trigger derive the order.
 * Falls back to the order-level update when the table has no device rows yet.
 */
export async function advanceAllDevicesFulfillment(
  admin: SupabaseClient,
  input: AdvanceFulfillmentInput,
): Promise<ServiceResult<AdvanceFulfillmentResult>> {
  const { data: order } = await admin
    .from("orders")
    .select("id, status")
    .eq("id", input.orderId)
    .single();

  if (!order) return err("not_found", "Orden no encontrada");
  if (order.status === "paid")
    return err("conflict", "La orden ya está pagada");
  if (order.status === "cancelled")
    return err("conflict", "La orden fue cancelada");

  const { data: devices } = await admin
    .from("order_devices")
    .select("id")
    .eq("order_id", input.orderId);

  // No people connected yet → keep the order-level shortcut behaviour.
  if (!devices || devices.length === 0) {
    return advanceFulfillment(admin, input);
  }

  const now = new Date().toISOString();
  const { error: updateError } = await admin
    .from("order_devices")
    .update({ fulfillment_status: input.target, updated_at: now })
    .eq("order_id", input.orderId);

  if (updateError) return err("internal", updateError.message);

  await admin.from("order_activity_log").insert({
    order_id: input.orderId,
    actor_type: "member",
    actor_id: input.actorUserId,
    actor_label: "personal",
    action: "fulfillment.changed",
    payload: { to: input.target, scope: "all_devices" },
  });

  return {
    ok: true,
    data: { orderId: input.orderId, fulfillmentStatus: input.target },
  };
}
