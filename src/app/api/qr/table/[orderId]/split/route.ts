import { NextResponse } from "next/server";

import { createAdminClient } from "@/lib/supabase/admin";
import { computeSplitByDevice } from "@/features/qr/helpers/computeSplitByDevice";

interface RouteContext {
  params: Promise<{ orderId: string }>;
}

interface SplitRequest {
  mode: "by_device" | "equal" | "items";
  people_count?: number;
}

export async function POST(request: Request, context: RouteContext) {
  const { orderId } = await context.params;
  const body = (await request.json()) as SplitRequest;
  const admin = createAdminClient();

  const { data: order } = await admin
    .from("orders")
    .select("id, total, status")
    .eq("id", orderId)
    .single();

  if (!order) {
    return NextResponse.json({ error: "Orden no encontrada" }, { status: 404 });
  }

  if (order.status === "paid" || order.status === "cancelled") {
    return NextResponse.json(
      { error: "No se puede dividir una orden cerrada" },
      { status: 409 },
    );
  }

  await admin.from("order_split_groups").delete().eq("order_id", orderId);

  let groups:
    | Array<{ label: string; total: number; device_id?: string | null }>
    | null = null;

  if (body.mode === "equal") {
    const people = Math.max(2, Number(body.people_count ?? 2));
    const eachAmount = Number(order.total) / people;
    groups = Array.from({ length: people }, (_, index) => ({
      label: `Persona ${index + 1}`,
      total: eachAmount,
      device_id: null,
    }));
  } else if (body.mode === "by_device") {
    const [{ data: devices }, { data: items }] = await Promise.all([
      admin
        .from("order_devices")
        .select("id, display_name, color_hex, joined_at, last_seen_at")
        .eq("order_id", orderId),
      admin
        .from("order_items")
        .select("id, product_id, quantity, unit_price, subtotal, added_by_device_id, is_shared")
        .eq("order_id", orderId),
    ]);

    const computed = computeSplitByDevice(items ?? [], devices ?? []);
    groups = computed.map((entry) => ({
      label: entry.label,
      total: entry.total,
      device_id: entry.deviceId,
    }));
  } else {
    return NextResponse.json(
      { error: "El modo items se configura desde la UI avanzada (pendiente)." },
      { status: 400 },
    );
  }

  if (!groups || groups.length === 0) {
    return NextResponse.json(
      { error: "No se pudo generar grupos para dividir la cuenta" },
      { status: 400 },
    );
  }

  const payload = groups.map((group) => ({
    order_id: orderId,
    device_id: group.device_id ?? null,
    label: group.label,
    subtotal: group.total,
    total: group.total,
    paid_total: 0,
    balance_due: group.total,
    payment_status: "pending",
  }));

  const { data: createdGroups, error } = await admin
    .from("order_split_groups")
    .insert(payload)
    .select("id, label, total, paid_total, balance_due, payment_status, device_id");

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  await admin.from("orders").update({ status: "pending_payment" }).eq("id", orderId);
  await admin.from("order_activity_log").insert({
    order_id: orderId,
    actor_type: "device",
    actor_label: "cliente",
    action: "split.created",
    payload: { mode: body.mode, groups: payload.length },
  });

  return NextResponse.json({ success: true, groups: createdGroups ?? [] });
}
