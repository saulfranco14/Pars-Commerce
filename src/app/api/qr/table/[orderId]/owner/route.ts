import { NextResponse } from "next/server";

import { createAdminClient } from "@/lib/supabase/admin";

interface RouteContext {
  params: Promise<{ orderId: string }>;
}

/** Claim the customer-side account role. It is intentional and race-safe. */
export async function POST(request: Request, context: RouteContext) {
  const { orderId } = await context.params;
  const fingerprint = request.headers.get("x-fingerprint-id")?.trim();
  if (!fingerprint) {
    return NextResponse.json({ error: "Identifica tu dispositivo para continuar" }, { status: 403 });
  }

  const admin = createAdminClient();
  const { data: order } = await admin
    .from("orders")
    .select("id, status")
    .eq("id", orderId)
    .maybeSingle();
  if (!order || ["paid", "cancelled"].includes(order.status)) {
    return NextResponse.json({ error: "Esta cuenta ya no estÃ¡ disponible" }, { status: 409 });
  }

  const { data: device } = await admin
    .from("order_devices")
    .select("id, display_name, is_owner")
    .eq("order_id", orderId)
    .eq("device_fingerprint", fingerprint)
    .maybeSingle();
  if (!device || !device.display_name?.trim()) {
    return NextResponse.json(
      { error: "EnvÃ­a al menos un producto con tu nombre antes de llevar la cuenta" },
      { status: 403 },
    );
  }

  const { count } = await admin
    .from("order_items")
    .select("id", { count: "exact", head: true })
    .eq("order_id", orderId)
    .eq("added_by_device_id", device.id);
  if (!count) {
    return NextResponse.json(
      { error: "Solo quien ya participa en esta mesa puede llevar la cuenta" },
      { status: 403 },
    );
  }

  if (device.is_owner) return NextResponse.json({ success: true });

  const { data: owner } = await admin
    .from("order_devices")
    .select("id")
    .eq("order_id", orderId)
    .eq("is_owner", true)
    .maybeSingle();
  if (owner && owner.id !== device.id) {
    return NextResponse.json(
      { error: "Otra persona ya lleva la cuenta de esta mesa" },
      { status: 409 },
    );
  }

  const { error } = await admin
    .from("order_devices")
    .update({ is_owner: true, updated_at: new Date().toISOString() })
    .eq("id", device.id);
  if (error?.code === "23505") {
    return NextResponse.json(
      { error: "Otra persona acaba de tomar la cuenta. Actualiza para verla." },
      { status: 409 },
    );
  }
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  await admin.from("order_activity_log").insert({
    order_id: orderId,
    actor_type: "device",
    actor_id: device.id,
    actor_label: device.display_name,
    action: "table.owner_claimed",
    payload: { device_id: device.id },
  });

  return NextResponse.json({ success: true });
}
