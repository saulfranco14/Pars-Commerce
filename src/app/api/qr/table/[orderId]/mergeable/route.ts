import { NextResponse } from "next/server";

import { createAdminClient } from "@/lib/supabase/admin";

interface RouteContext {
  params: Promise<{ orderId: string }>;
}

/**
 * Lists other active tables of the same tenant that the customer could merge
 * their table with. Returns only label + order_id (no bills/customer data).
 * Gated by device membership on the primary order.
 */
export async function GET(request: Request, context: RouteContext) {
  const { orderId } = await context.params;
  const fingerprint = request.headers.get("x-fingerprint-id")?.trim() ?? null;
  if (!fingerprint) {
    return NextResponse.json({ error: "Sin dispositivo" }, { status: 400 });
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

  // Gate: caller must be on this order.
  const { data: device } = await admin
    .from("order_devices")
    .select("id")
    .eq("order_id", orderId)
    .eq("device_fingerprint", fingerprint)
    .maybeSingle();
  if (!device) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  // Other active table QR codes for this tenant, with a current order.
  const { data: qrCodes } = await admin
    .from("qr_codes")
    .select("id, label, current_order_id")
    .eq("tenant_id", order.tenant_id)
    .eq("kind", "table")
    .eq("is_active", true)
    .is("archived_at", null)
    .not("current_order_id", "is", null)
    .neq("current_order_id", orderId);

  const tables = (qrCodes ?? [])
    .filter((q) => q.current_order_id)
    .map((q) => ({ order_id: q.current_order_id as string, label: q.label }));

  return NextResponse.json({ tables });
}
