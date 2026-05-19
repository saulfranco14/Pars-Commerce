import { resolveUserError } from "@/lib/errors/resolveUserError";
import { createAdminClient } from "@/lib/supabase/admin";
import { NextResponse } from "next/server";

const DEVICE_COLORS = [
  "#3b82f6",
  "#8b5cf6",
  "#10b981",
  "#f59e0b",
  "#ec4899",
  "#14b8a6",
];

function pickColor(index: number) {
  return DEVICE_COLORS[index % DEVICE_COLORS.length];
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const token = (searchParams.get("token") ?? "").trim();
  const fingerprint = request.headers.get("x-fingerprint-id")?.trim() ?? null;

  if (!token) {
    return NextResponse.json({ error: "token is required" }, { status: 400 });
  }

  const admin = createAdminClient();
  const { data: qrCode, error: qrError } = await admin
    .from("qr_codes")
    .select(
      "id, tenant_id, token, kind, label, table_capacity, preset_amount, preset_concept, allow_amount_override, is_active, archived_at, current_order_id",
    )
    .eq("token", token)
    .is("archived_at", null)
    .eq("is_active", true)
    .single();

  if (qrError || !qrCode) {
    return NextResponse.json({ error: "QR no encontrado" }, { status: 404 });
  }

  const { data: tenant } = await admin
    .from("tenants")
    .select("id, name, slug, public_store_enabled")
    .eq("id", qrCode.tenant_id)
    .single();

  if (!tenant) {
    return NextResponse.json({ error: "Negocio no disponible" }, { status: 404 });
  }

  if (!tenant.public_store_enabled) {
    return NextResponse.json(
      { error: "La tienda pública de este negocio no está activa" },
      { status: 403 },
    );
  }

  const response: Record<string, unknown> = {
    tenant,
    qr_code: qrCode,
    kind: qrCode.kind,
  };

  if (qrCode.kind === "table") {
    let orderId = qrCode.current_order_id as string | null;
    if (orderId) {
      const { data: existingOrder } = await admin
        .from("orders")
        .select("id, status, subtotal, total, paid_total, balance_due")
        .eq("id", orderId)
        .single();

      if (!existingOrder || ["paid", "cancelled"].includes(existingOrder.status)) {
        orderId = null;
      } else {
        response.order = existingOrder;
      }
    }

    if (!orderId) {
      const { data: order, error: orderError } = await admin
        .from("orders")
        .insert({
          tenant_id: tenant.id,
          status: "draft",
          subtotal: 0,
          total: 0,
          discount: 0,
          source: "qr_table",
          order_type: "dine_in",
          qr_code_id: qrCode.id,
          table_label: qrCode.label,
          diner_count: 0,
        })
        .select("id, status, subtotal, total, paid_total, balance_due")
        .single();

      if (orderError || !order) {
        return NextResponse.json(
          { error: resolveUserError(orderError, "supabase") },
          { status: 500 },
        );
      }
      orderId = order.id;
      response.order = order;
      await admin
        .from("qr_codes")
        .update({ current_order_id: order.id, updated_at: new Date().toISOString() })
        .eq("id", qrCode.id);
      await admin.from("order_activity_log").insert({
        order_id: order.id,
        actor_type: "system",
        actor_label: "sistema",
        action: "order.created",
        payload: { qr_code_id: qrCode.id, table_label: qrCode.label },
      });
    }

    if (fingerprint) {
      const now = new Date().toISOString();

      // Check if this device already has a row for THIS order. If not, it
      // means either (a) brand-new device, or (b) returning device whose
      // previous order already closed. In both cases the customer must go
      // through the name prompt again — we never silently revive a stale
      // identity onto a fresh order. The is_new_session flag tells the
      // client to clear the cached display_name in localStorage.
      const { data: existing } = await admin
        .from("order_devices")
        .select("id, display_name, color_hex, joined_at, last_seen_at")
        .eq("order_id", orderId)
        .eq("device_fingerprint", fingerprint)
        .maybeSingle();

      let isNewSession = false;

      if (existing) {
        await admin
          .from("order_devices")
          .update({ last_seen_at: now, updated_at: now })
          .eq("id", existing.id);
        response.my_device = existing;
      } else {
        isNewSession = true;
        const { data: allDevices } = await admin
          .from("order_devices")
          .select("id")
          .eq("order_id", orderId);
        const color = pickColor((allDevices ?? []).length);
        const { data: device } = await admin
          .from("order_devices")
          .insert({
            order_id: orderId,
            device_fingerprint: fingerprint,
            display_name: null,
            color_hex: color,
            last_seen_at: now,
            updated_at: now,
          })
          .select("id, display_name, color_hex, joined_at, last_seen_at")
          .single();
        response.my_device = device ?? null;
      }

      response.is_new_session = isNewSession;

      const { count } = await admin
        .from("order_devices")
        .select("id", { count: "exact", head: true })
        .eq("order_id", orderId);
      response.connected_devices = count ?? 0;
    }

    const { data: menu } = await admin
      .from("products")
      .select("id, name, slug, type, price, image_url")
      .eq("tenant_id", tenant.id)
      .eq("is_public", true)
      .is("deleted_at", null)
      .order("name");

    response.menu = menu ?? [];
  }

  return NextResponse.json(response);
}
