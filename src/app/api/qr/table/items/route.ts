import { NextResponse } from "next/server";

import { createAdminClient } from "@/lib/supabase/admin";
import { resolveUserError } from "@/lib/errors/resolveUserError";

interface TableItemPayload {
  product_id: string;
  quantity: number;
  is_shared?: boolean;
}

interface RequestBody {
  order_id: string;
  qr_token: string;
  items: TableItemPayload[];
}

export async function POST(request: Request) {
  let body: RequestBody;
  try {
    body = (await request.json()) as RequestBody;
  } catch {
    return NextResponse.json({ error: "JSON inválido" }, { status: 400 });
  }

  if (!body.order_id || !body.qr_token || !Array.isArray(body.items)) {
    return NextResponse.json(
      { error: "order_id, qr_token e items son requeridos" },
      { status: 400 },
    );
  }

  const admin = createAdminClient();
  const fingerprint = request.headers.get("x-fingerprint-id")?.trim() || null;

  const { data: qrCode } = await admin
    .from("qr_codes")
    .select("id, tenant_id, current_order_id")
    .eq("token", body.qr_token)
    .eq("kind", "table")
    .single();

  if (!qrCode || qrCode.current_order_id !== body.order_id) {
    return NextResponse.json(
      { error: "QR inválido para esta orden" },
      { status: 403 },
    );
  }

  const { data: order } = await admin
    .from("orders")
    .select("id, tenant_id, status, subtotal, total")
    .eq("id", body.order_id)
    .single();

  if (!order) {
    return NextResponse.json({ error: "Orden no encontrada" }, { status: 404 });
  }

  if (["pending_payment", "paid", "cancelled"].includes(order.status)) {
    return NextResponse.json(
      { error: "La orden ya no acepta nuevos productos" },
      { status: 409 },
    );
  }

  let deviceId: string | null = null;
  if (fingerprint) {
    const { data: device } = await admin
      .from("order_devices")
      .select("id")
      .eq("order_id", body.order_id)
      .eq("device_fingerprint", fingerprint)
      .single();
    deviceId = device?.id ?? null;
  }

  const validItems = body.items.filter(
    (item) =>
      item.product_id &&
      Number.isFinite(Number(item.quantity)) &&
      Number(item.quantity) > 0,
  );

  if (validItems.length === 0) {
    return NextResponse.json(
      { error: "No hay items válidos para agregar" },
      { status: 400 },
    );
  }

  const productIds = validItems.map((item) => item.product_id);
  const { data: products } = await admin
    .from("products")
    .select("id, price")
    .in("id", productIds)
    .eq("tenant_id", order.tenant_id);

  const priceMap = new Map<string, number>();
  for (const product of products ?? []) {
    priceMap.set(product.id, Number(product.price));
  }

  const rows = validItems
    .map((item) => {
      const unitPrice = priceMap.get(item.product_id);
      if (unitPrice === undefined) return null;
      const quantity = Number(item.quantity);
      return {
        order_id: body.order_id,
        product_id: item.product_id,
        quantity,
        unit_price: unitPrice,
        subtotal: unitPrice * quantity,
        added_by_device_id: deviceId,
        is_shared: item.is_shared === true,
      };
    })
    .filter(Boolean);

  if (rows.length === 0) {
    return NextResponse.json(
      { error: "Ningún producto coincide con el negocio" },
      { status: 404 },
    );
  }

  const { error: insertError } = await admin.from("order_items").insert(rows);
  if (insertError) {
    return NextResponse.json(
      { error: resolveUserError(insertError, "supabase") },
      { status: 500 },
    );
  }

  const addedSubtotal = rows.reduce(
    (acc, row) => acc + Number(row?.subtotal ?? 0),
    0,
  );
  const nextSubtotal = Number(order.subtotal) + addedSubtotal;
  const { data: updatedOrder, error: updateOrderError } = await admin
    .from("orders")
    .update({
      status: "in_progress",
      subtotal: nextSubtotal,
      total: nextSubtotal,
      balance_due: nextSubtotal,
      updated_at: new Date().toISOString(),
    })
    .eq("id", body.order_id)
    .select("id, status, subtotal, total, balance_due")
    .single();

  if (updateOrderError) {
    return NextResponse.json(
      { error: resolveUserError(updateOrderError, "supabase") },
      { status: 500 },
    );
  }

  await admin.from("order_activity_log").insert({
    order_id: body.order_id,
    actor_type: deviceId ? "device" : "system",
    actor_id: deviceId,
    actor_label: null,
    action: "item.added",
    payload: {
      count: rows.length,
      subtotal: addedSubtotal,
    },
  });

  return NextResponse.json({
    success: true,
    order: updatedOrder,
    added_items: rows.length,
  });
}
