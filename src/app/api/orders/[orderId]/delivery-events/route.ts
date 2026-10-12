import { NextResponse } from "next/server";

import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { requirePermission } from "@/lib/auth/requirePermission";
import { resolveOrderFulfillmentMethod } from "@/features/orders/helpers/resolveOrderFulfillmentMethod";

type CommerceAdmin = { from: (table: string) => any; storage: any };

export async function POST(request: Request, { params }: { params: Promise<{ orderId: string }> }) {
  const { orderId } = await params;
  const form = await request.formData();
  const type = form.get("type");
  const note = form.get("note");
  const photo = form.get("photo");
  if (type !== "out_for_delivery" && type !== "delivered" && type !== "pickup_completed") return NextResponse.json({ error: "Evento de entrega no válido." }, { status: 400 });
  const isCompletion = type === "delivered" || type === "pickup_completed";
  if (isCompletion && !(photo instanceof File)) return NextResponse.json({ error: "La foto de entrega es obligatoria." }, { status: 400 });
  if (photo instanceof File && (!photo.type.startsWith("image/") || photo.size > 8 * 1024 * 1024)) return NextResponse.json({ error: "La evidencia debe ser una imagen de máximo 8 MB." }, { status: 400 });
  const session = await createClient();
  const { data: { user } } = await session.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const admin = createAdminClient() as unknown as CommerceAdmin;
  const { data: order } = await admin.from("orders").select("id, tenant_id, status, fulfillment_status, fulfillment_method, total, paid_total, paid_at, payment_verification_status").eq("id", orderId).maybeSingle();
  if (!order) return NextResponse.json({ error: "Orden no encontrada." }, { status: 404 });
  const { data: deliveryDetails } = await admin
    .from("order_delivery_details")
    .select("address_text, pickup_point_id")
    .eq("order_id", orderId)
    .maybeSingle();
  const fulfillmentMethod = resolveOrderFulfillmentMethod({
    ...order,
    delivery_details: deliveryDetails,
  });
  const canFulfill = await requirePermission(user.id, order.tenant_id, "qr.fulfill");
  if (!canFulfill) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const { data: existingEvents } = await admin
    .from("order_delivery_events")
    .select("id, type, photo_path")
    .eq("order_id", orderId);
  const findEvent = (eventType: string) =>
    (existingEvents ?? []).find(
      (event: { type: string }) => event.type === eventType,
    );
  const hasEvent = (eventType: string) => Boolean(findEvent(eventType));
  const existingEvent = findEvent(type) as
    | { id: string; type: string; photo_path?: string | null }
    | undefined;

  if (existingEvent?.photo_path || (existingEvent && !isCompletion)) {
    return NextResponse.json({ success: true, already_completed: true });
  }
  const paymentSettled =
    order.status === "paid" ||
    Boolean(order.paid_at) ||
    Number(order.paid_total ?? 0) >= Number(order.total) ||
    order.payment_verification_status === "approved";
  if (!paymentSettled) {
    return NextResponse.json(
      { error: "El pedido debe estar pagado antes de continuar con la entrega." },
      { status: 409 },
    );
  }
  if (order.fulfillment_status !== "ready") {
    return NextResponse.json(
      { error: "Primero marca el pedido como listo." },
      { status: 409 },
    );
  }
  if (type === "pickup_completed" && fulfillmentMethod !== "pickup") {
    return NextResponse.json(
      { error: "Este pedido no es para recolección." },
      { status: 409 },
    );
  }
  if (type !== "pickup_completed" && fulfillmentMethod !== "delivery") {
    return NextResponse.json(
      { error: "Este pedido no tiene entrega a domicilio." },
      { status: 409 },
    );
  }
  if (type === "delivered" && !hasEvent("out_for_delivery")) {
    return NextResponse.json(
      { error: "Primero marca el pedido como en camino." },
      { status: 409 },
    );
  }
  if (
    fulfillmentMethod &&
    fulfillmentMethod !== order.fulfillment_method
  ) {
    await admin
      .from("orders")
      .update({ fulfillment_method: fulfillmentMethod })
      .eq("id", orderId);
  }
  let photoPath: string | null = null;
  if (photo instanceof File) {
    const extension = photo.type.split("/")[1] || "jpg";
    photoPath = `${order.tenant_id}/orders/${orderId}/delivery-${crypto.randomUUID()}.${extension}`;
    const { error: uploadError } = await admin.storage.from("order-delivery-proofs").upload(photoPath, photo, { contentType: photo.type, upsert: false });
    if (uploadError) return NextResponse.json({ error: uploadError.message }, { status: 500 });
  }
  const eventPayload = {
    note: typeof note === "string" ? note.trim() || null : null,
    photo_path: photoPath,
  };
  const { data: savedEvent, error } = existingEvent
    ? await admin
        .from("order_delivery_events")
        .update(eventPayload)
        .eq("id", existingEvent.id)
        .select("id, type, note, photo_path, created_at, created_by")
        .single()
    : await admin.from("order_delivery_events").insert({
        order_id: orderId,
        type,
        ...eventPayload,
        created_by: user.id,
      })
        .select("id, type, note, photo_path, created_at, created_by")
        .single();
  if (error) {
    if (photoPath) {
      await admin.storage.from("order-delivery-proofs").remove([photoPath]);
    }
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
  if (type === "delivered" || type === "pickup_completed") {
    const completedAt = new Date().toISOString();
    await admin
      .from("orders")
      .update({
        status: "completed",
        completed_at: completedAt,
        completed_by: user.id,
        ...(type === "pickup_completed"
          ? {
              pickup_completed_at: completedAt,
              pickup_completed_by: user.id,
            }
          : {}),
        updated_at: completedAt,
      })
      .eq("id", orderId);
  }
  await admin.from("order_activity_log").insert({
    order_id: orderId,
    actor_type: "member",
    actor_id: user.id,
    actor_label: "personal",
    action: existingEvent ? "delivery.evidence_attached" : `delivery.${type}`,
    payload: {
      event_type: type,
      note: typeof note === "string" ? note.trim() || null : null,
    },
  });
  return NextResponse.json({ success: true, event: savedEvent });
}
