import { NextResponse } from "next/server";

import { createAdminClient } from "@/lib/supabase/admin";

interface RouteContext {
  params: Promise<{ orderId: string }>;
}

export async function GET(request: Request, context: RouteContext) {
  const { orderId } = await context.params;
  const fingerprint = request.headers.get("x-fingerprint-id")?.trim() ?? null;
  const admin = createAdminClient();

  const { data: order } = await admin
    .from("orders")
    .select(
      "id, tenant_id, status, total, paid_total, balance_due, created_at, qr_code_id, payment_method",
    )
    .eq("id", orderId)
    .single();

  if (!order) {
    return NextResponse.json({ error: "Orden no encontrada" }, { status: 404 });
  }

  const { data: tenant } = await admin
    .from("tenants")
    .select("id, name, slug")
    .eq("id", order.tenant_id)
    .single();

  const [{ data: qrCode }, { data: splitGroups }, { data: items }, { data: devices }] =
    await Promise.all([
      order.qr_code_id
        ? admin
            .from("qr_codes")
            .select("id, label")
            .eq("id", order.qr_code_id)
            .maybeSingle()
        : Promise.resolve({ data: null }),
      admin
        .from("order_split_groups")
        .select(
          "id, label, total, paid_total, balance_due, payment_status, device_id",
        )
        .eq("order_id", orderId)
        .order("created_at", { ascending: true }),
      admin
        .from("order_items")
        .select(
          "id, product_id, quantity, unit_price, subtotal, added_by_device_id, is_shared",
        )
        .eq("order_id", orderId)
        .order("created_at", { ascending: true }),
      admin
        .from("order_devices")
        .select("id, display_name, color_hex, joined_at, last_seen_at")
        .eq("order_id", orderId)
        .order("joined_at", { ascending: true }),
    ]);

  // Fetch product names so the bill can show "1x Encerado" instead of an id.
  const productIds = Array.from(
    new Set((items ?? []).map((i) => i.product_id).filter(Boolean)),
  );
  let productNameMap = new Map<string, string>();
  if (productIds.length > 0) {
    const { data: products } = await admin
      .from("products")
      .select("id, name")
      .in("id", productIds);
    productNameMap = new Map(
      (products ?? []).map((p) => [p.id as string, p.name as string]),
    );
  }

  const enrichedItems = (items ?? []).map((item) => ({
    id: item.id,
    product_id: item.product_id,
    product_name: productNameMap.get(item.product_id) ?? "Producto",
    quantity: Number(item.quantity),
    unit_price: Number(item.unit_price),
    subtotal: Number(item.subtotal),
    added_by_device_id: item.added_by_device_id,
    is_shared: item.is_shared === true,
  }));

  const groups =
    splitGroups && splitGroups.length > 0
      ? splitGroups
      : [
          {
            id: `order-${order.id}`,
            label: "Cuenta total",
            total: Number(order.total),
            paid_total: Number(order.paid_total ?? 0),
            balance_due: Number(order.balance_due ?? order.total),
            payment_status:
              Number(order.balance_due ?? order.total) <= 0 ? "paid" : "pending",
            device_id: null,
          },
        ];

  // Resolve current device id from fingerprint so the UI can highlight "tu cuenta".
  let myDeviceId: string | null = null;
  if (fingerprint) {
    const { data: device } = await admin
      .from("order_devices")
      .select("id")
      .eq("order_id", orderId)
      .eq("device_fingerprint", fingerprint)
      .maybeSingle();
    myDeviceId = device?.id ?? null;
  }

  return NextResponse.json({
    order: {
      id: order.id,
      status: order.status,
      total: Number(order.total),
      paid_total: Number(order.paid_total ?? 0),
      balance_due: Number(order.balance_due ?? order.total),
      created_at: order.created_at,
      payment_method: order.payment_method ?? null,
    },
    tenant: tenant ?? null,
    qr_code: qrCode ?? null,
    groups,
    items: enrichedItems,
    devices: devices ?? [],
    my_device_id: myDeviceId,
  });
}
