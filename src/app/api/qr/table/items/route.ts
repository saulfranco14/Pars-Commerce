import { NextResponse } from "next/server";

import { createAdminClient } from "@/lib/supabase/admin";
import { resolveUserError } from "@/lib/errors/resolveUserError";
import { resetFulfillmentForNewItems } from "@/features/qr/services/tableFulfillmentService";
import {
  buildOrderItemRows,
  filterValidItems,
} from "@/features/qr/helpers/buildOrderItemRows";

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
    .select("id, tenant_id, status, subtotal, total, table_label")
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

  const validItems = filterValidItems(body.items);

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

  const priceByProduct = new Map<string, number>();
  for (const product of products ?? []) {
    priceByProduct.set(product.id, Number(product.price));
  }

  const rows = buildOrderItemRows({
    orderId: body.order_id,
    items: validItems,
    priceByProduct,
    addedByDeviceId: deviceId,
    // Snapshot the table this was ordered at, so it survives a later merge.
    originTableLabel: order.table_label ?? null,
  });

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

  // A new batch restarts THIS person's preparation state (received) — the
  // journey begins again and the payment gate closes until the business marks
  // the new work ready. Other people at the table are untouched.
  await resetFulfillmentForNewItems(admin, {
    orderId: body.order_id,
    deviceId,
  });

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
