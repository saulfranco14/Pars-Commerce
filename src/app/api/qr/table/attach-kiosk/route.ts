import { NextResponse } from "next/server";

import { releaseTableQrIfPaid } from "@/features/qr/helpers/releaseTableQrIfPaid";
import { createAdminClient } from "@/lib/supabase/admin";

interface AttachKioskBody {
  table_token?: string;
  ticket_token?: string;
}

const DEVICE_COLORS = ["#8b5cf6", "#10b981", "#f59e0b", "#84cc16", "#0891b2", "#3b82f6"];

/**
 * Explicitly attaches an existing kiosk order to a free table. A kiosk ticket
 * is the proof of ownership; an order id or visible order number is never
 * enough to claim a table.
 */
export async function POST(request: Request) {
  const fingerprint = request.headers.get("x-fingerprint-id")?.trim();
  if (!fingerprint) {
    return NextResponse.json({ error: "Sin dispositivo" }, { status: 400 });
  }

  let body: AttachKioskBody;
  try {
    body = (await request.json()) as AttachKioskBody;
  } catch {
    return NextResponse.json({ error: "JSON inválido" }, { status: 400 });
  }
  const tableToken = body.table_token?.trim();
  const ticketToken = body.ticket_token?.trim();
  if (!tableToken || !ticketToken) {
    return NextResponse.json(
      { error: "Faltan el QR de mesa o el ticket de autoservicio" },
      { status: 400 },
    );
  }

  const admin = createAdminClient();
  const [{ data: tableQr }, { data: ticketQr }] = await Promise.all([
    admin
      .from("qr_codes")
      .select("id, tenant_id, label, current_order_id, is_active, archived_at")
      .eq("token", tableToken)
      .eq("kind", "table")
      .maybeSingle(),
    admin
      .from("qr_codes")
      .select("id, tenant_id, current_order_id")
      .eq("token", ticketToken)
      .eq("kind", "order")
      .maybeSingle(),
  ]);

  if (!tableQr || tableQr.is_active !== true || tableQr.archived_at !== null) {
    return NextResponse.json({ error: "Mesa no disponible" }, { status: 404 });
  }
  if (tableQr.current_order_id) {
    return NextResponse.json(
      { error: "Esta mesa ya tiene un pedido activo" },
      { status: 409 },
    );
  }
  if (
    !ticketQr?.current_order_id ||
    ticketQr.tenant_id !== tableQr.tenant_id
  ) {
    return NextResponse.json({ error: "Ticket no válido para esta mesa" }, { status: 403 });
  }

  const orderId = ticketQr.current_order_id as string;
  const { data: order } = await admin
    .from("orders")
    .select("id, tenant_id, source, status, fulfillment_status")
    .eq("id", orderId)
    .maybeSingle();
  if (!order || order.tenant_id !== tableQr.tenant_id || order.source !== "kiosk") {
    return NextResponse.json({ error: "Este ticket no es de autoservicio" }, { status: 409 });
  }
  if (order.status === "cancelled") {
    return NextResponse.json({ error: "Este pedido fue cancelado" }, { status: 409 });
  }

  const [{ data: pendingPayment }, { data: attachedTable }] = await Promise.all([
    admin
      .from("payments")
      .select("id")
      .eq("order_id", orderId)
      .eq("status", "pending")
      .limit(1)
      .maybeSingle(),
    admin
      .from("qr_codes")
      .select("id")
      .eq("kind", "table")
      .eq("current_order_id", orderId)
      .maybeSingle(),
  ]);
  if (pendingPayment) {
    return NextResponse.json(
      { error: "El pago de este pedido está esperando confirmación" },
      { status: 409 },
    );
  }
  if (attachedTable) {
    return NextResponse.json(
      { error: "Este pedido ya está vinculado a otra mesa" },
      { status: 409 },
    );
  }

  const now = new Date().toISOString();
  // Conditional claim prevents two people from taking the same physical table.
  const { data: claimedTable, error: claimError } = await admin
    .from("qr_codes")
    .update({ current_order_id: orderId, updated_at: now })
    .eq("id", tableQr.id)
    .is("current_order_id", null)
    .select("id")
    .maybeSingle();
  if (claimError || !claimedTable) {
    return NextResponse.json(
      { error: "La mesa acaba de ocuparse. Inténtalo de nuevo." },
      { status: 409 },
    );
  }

  const { data: existingDevices } = await admin
    .from("order_devices")
    .select("id")
    .eq("order_id", orderId)
    .order("joined_at", { ascending: true });
  let deviceId: string | null = null;

  // A kiosk order has no customer device until its owner chooses a table. The
  // first table device becomes the owner of the items created at the kiosk.
  const { data: matchingDevice } = await admin
    .from("order_devices")
    .select("id")
    .eq("order_id", orderId)
    .eq("device_fingerprint", fingerprint)
    .maybeSingle();
  deviceId = matchingDevice?.id ?? null;
  if (!deviceId) {
    const { data: insertedDevice, error: deviceError } = await admin
      .from("order_devices")
      .insert({
        order_id: orderId,
        device_fingerprint: fingerprint,
        display_name: null,
        color_hex: DEVICE_COLORS[(existingDevices ?? []).length % DEVICE_COLORS.length],
        is_owner: (existingDevices ?? []).length === 0,
        last_seen_at: now,
        updated_at: now,
      })
      .select("id")
      .single();
    if (deviceError || !insertedDevice) {
      await admin
        .from("qr_codes")
        .update({ current_order_id: null, updated_at: now })
        .eq("id", tableQr.id)
        .eq("current_order_id", orderId);
      return NextResponse.json({ error: "No se pudo vincular al cliente" }, { status: 500 });
    }
    deviceId = insertedDevice.id;
  }

  await Promise.all([
    admin
      .from("orders")
      .update({ order_type: "dine_in", table_label: tableQr.label, updated_at: now })
      .eq("id", orderId),
    admin
      .from("order_items")
      .update({ added_by_device_id: deviceId })
      .eq("order_id", orderId)
      .is("added_by_device_id", null),
  ]);

  await admin.from("order_activity_log").insert({
    order_id: orderId,
    actor_type: "device",
    actor_id: deviceId,
    actor_label: "cliente",
    action: "table.attached_to_kiosk",
    payload: { table_qr_id: tableQr.id, table_label: tableQr.label },
  });

  // A finished, already-paid kiosk order does not need to reserve a table.
  // This is safe for an order still in preparation: the helper preserves its
  // ticket and the just-attached table until the fulfillment is ready.
  if (order.status === "paid" && order.fulfillment_status === "ready") {
    await releaseTableQrIfPaid(admin, orderId);
  }

  return NextResponse.json({ success: true, order_id: orderId });
}
