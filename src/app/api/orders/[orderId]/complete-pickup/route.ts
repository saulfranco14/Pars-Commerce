/* eslint-disable @typescript-eslint/no-explicit-any -- Commerce schema types are regenerated after the migration rollout. */
import { NextResponse } from "next/server";

import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import {
  canAccessOrder,
  resolveOrderAccess,
} from "@/features/orders/services/orderAccessService";
import { serviceErrorToResponse } from "@/features/qr/services/serviceErrorToResponse";
import { resolveOrderFulfillmentMethod } from "@/features/orders/helpers/resolveOrderFulfillmentMethod";

export async function POST(
  _request: Request,
  { params }: { params: Promise<{ orderId: string }> },
) {
  const { orderId } = await params;
  const supabase = await createClient();
  const admin = createAdminClient() as unknown as {
    from: (table: string) => any;
  };
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { data: order, error: orderError } = await admin
    .from("orders")
    .select("id, tenant_id, status, source, fulfillment_status, fulfillment_method, total, paid_total, paid_at, payment_verification_status, assigned_to, created_by, scheduled_for, pickup_completed_at")
    .eq("id", orderId)
    .maybeSingle();
  if (orderError || !order) {
    return NextResponse.json({ error: orderError?.message ?? "No encontramos la orden." }, { status: 404 });
  }
  const { data: deliveryDetails } = await admin
    .from("order_delivery_details")
    .select("address_text, pickup_point_id")
    .eq("order_id", orderId)
    .maybeSingle();
  const fulfillmentMethod = resolveOrderFulfillmentMethod({
    ...order,
    delivery_details: deliveryDetails,
  });
  const isPickup = fulfillmentMethod === "pickup";
  if (!isPickup) {
    return NextResponse.json({ error: "Esta orden no es para recolección." }, { status: 409 });
  }
  const paymentSettled =
    order.status === "paid" ||
    Boolean(order.paid_at) ||
    Number(order.paid_total ?? 0) >= Number(order.total) ||
    order.payment_verification_status === "approved";
  if (!paymentSettled) {
    return NextResponse.json({ error: "Primero registra el cobro antes de confirmar la recolección." }, { status: 409 });
  }
  if (order.source === "public_store" && order.fulfillment_status !== "ready") {
    return NextResponse.json({ error: "Primero marca el pedido como listo." }, { status: 409 });
  }

  const access = await resolveOrderAccess(user.id, order.tenant_id);
  if (!access.ok) return serviceErrorToResponse(access.error);
  if (!access.data.canWrite || !canAccessOrder(access.data, order)) {
    return NextResponse.json({ error: "No tienes permiso para cerrar esta recolección." }, { status: 403 });
  }

  // Idempotent: a double tap must not overwrite who registered the pickup.
  if (order.pickup_completed_at) {
    return NextResponse.json({ success: true, already_completed: true });
  }

  const completedAt = new Date().toISOString();
  const { data: updated, error: updateError } = await admin
    .from("orders")
    .update({
      status: "completed",
      completed_at: completedAt,
      completed_by: user.id,
      pickup_completed_at: completedAt,
      pickup_completed_by: user.id,
      updated_at: completedAt,
    })
    .eq("id", order.id)
    .is("pickup_completed_at", null)
    .select("id, pickup_completed_at, pickup_completed_by")
    .maybeSingle();
  if (updateError) return NextResponse.json({ error: updateError.message }, { status: 500 });
  if (!updated) return NextResponse.json({ success: true, already_completed: true });

  await admin.from("order_delivery_events").insert({
    order_id: order.id,
    type: "pickup_completed",
    created_by: user.id,
  });

  await admin.from("order_activity_log").insert({
    order_id: order.id,
    actor_type: "member",
    actor_id: user.id,
    actor_label: "personal",
    action: "pickup.completed",
    payload: { scheduled_for: order.scheduled_for, completed_at: completedAt },
  });

  return NextResponse.json({ success: true, pickup_completed_at: completedAt });
}
