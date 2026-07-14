import { NextResponse } from "next/server";

import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { requirePermission } from "@/lib/auth/requirePermission";
import {
  advanceAllDevicesFulfillment,
  advanceDeviceFulfillment,
  advanceFulfillment,
  advanceItemFulfillment,
  type FulfillmentStatus,
} from "@/features/qr/services/tableFulfillmentService";
import { serviceErrorToResponse } from "@/features/qr/services/serviceErrorToResponse";

interface RouteContext {
  params: Promise<{ orderId: string }>;
}

interface RequestBody {
  status: FulfillmentStatus;
  /** Advance ONE product line's state (order_items.id). */
  order_item_id?: string;
  /** Advance ONE person's state (order_devices.id). */
  device_id?: string;
  /** Whole-table shortcut: set every person to `status`. */
  all?: boolean;
}

function isFulfillmentStatus(value: unknown): value is FulfillmentStatus {
  return value === "received" || value === "in_progress" || value === "ready";
}

/**
 * Staff advances the preparation state of a table order
 * (received → in_progress → ready). Requires the `qr.fulfill` permission
 * (owner + waiter). This adapts HTTP; the rules live in
 * `tableFulfillmentService.advanceFulfillment`.
 */
export async function POST(request: Request, context: RouteContext) {
  const { orderId } = await context.params;

  let body: RequestBody;
  try {
    body = (await request.json()) as RequestBody;
  } catch {
    return NextResponse.json({ error: "JSON inválido" }, { status: 400 });
  }

  if (!isFulfillmentStatus(body.status)) {
    return NextResponse.json(
      { error: "status debe ser received, in_progress o ready" },
      { status: 400 },
    );
  }

  const supabase = await createClient();
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const admin = createAdminClient();
  const { data: order } = await admin
    .from("orders")
    .select("id, tenant_id")
    .eq("id", orderId)
    .single();

  if (!order) {
    return NextResponse.json({ error: "Orden no encontrada" }, { status: 404 });
  }

  const permission = await requirePermission(
    user.id,
    order.tenant_id,
    "qr.fulfill",
  );
  if (!permission) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  // One product line's state → per-item (the DB trigger cascade derives both
  // the device and order summaries).
  if (typeof body.order_item_id === "string" && body.order_item_id) {
    const result = await advanceItemFulfillment(admin, {
      orderId,
      orderItemId: body.order_item_id,
      target: body.status,
      actorUserId: user.id,
    });
    if (!result.ok) return serviceErrorToResponse(result.error);
    return NextResponse.json({
      success: true,
      order_item_id: result.data.orderItemId,
      item_fulfillment_status: result.data.itemStatus,
      device_fulfillment_status: result.data.deviceStatus,
      fulfillment_status: result.data.orderStatus,
    });
  }

  // One person's state → per-device (the DB trigger derives the order summary).
  if (typeof body.device_id === "string" && body.device_id) {
    const result = await advanceDeviceFulfillment(admin, {
      orderId,
      deviceId: body.device_id,
      target: body.status,
      actorUserId: user.id,
    });
    if (!result.ok) return serviceErrorToResponse(result.error);
    return NextResponse.json({
      success: true,
      device_id: result.data.deviceId,
      device_fulfillment_status: result.data.deviceStatus,
      fulfillment_status: result.data.orderStatus,
    });
  }

  // Whole-table shortcut: mark everyone at once.
  if (body.all === true) {
    const result = await advanceAllDevicesFulfillment(admin, {
      orderId,
      target: body.status,
      actorUserId: user.id,
    });
    if (!result.ok) return serviceErrorToResponse(result.error);
    return NextResponse.json({
      success: true,
      fulfillment_status: result.data.fulfillmentStatus,
    });
  }

  // Legacy order-level advance (kept for backward compatibility).
  const result = await advanceFulfillment(admin, {
    orderId,
    target: body.status,
    actorUserId: user.id,
  });

  if (!result.ok) return serviceErrorToResponse(result.error);

  return NextResponse.json({
    success: true,
    fulfillment_status: result.data.fulfillmentStatus,
  });
}
