import { createAdminClient } from "@/lib/supabase/admin";
import { NextResponse } from "next/server";

const FINGERPRINT_HEADER = "x-fingerprint-id";

function getFingerprint(request: Request): string | null {
  return request.headers.get(FINGERPRINT_HEADER)?.trim() || null;
}

export async function POST(request: Request) {
  const fingerprint = getFingerprint(request);

  if (!fingerprint) {
    return NextResponse.json(
      { error: "x-fingerprint-id header is required" },
      { status: 400 }
    );
  }

  let body: {
    tenant_id?: string;
    cart_id?: string;
    customer_name?: string;
    customer_email?: string;
    customer_phone?: string;
  };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const { tenant_id, cart_id, customer_name, customer_email, customer_phone } = body;

  if (!tenant_id || !cart_id) {
    return NextResponse.json(
      { error: "tenant_id and cart_id are required" },
      { status: 400 }
    );
  }

  if (!customer_name?.trim() || !customer_email?.trim() || !customer_phone?.trim()) {
    return NextResponse.json(
      { error: "customer_name, customer_email and customer_phone are required" },
      { status: 400 }
    );
  }

  const admin = createAdminClient();

  const { data: tenant } = await admin
    .from("tenants")
    .select("id")
    .eq("id", tenant_id)
    .eq("public_store_enabled", true)
    .single();

  if (!tenant) {
    return NextResponse.json(
      { error: "Tenant not found or public store disabled" },
      { status: 404 }
    );
  }

  const { data: cart } = await admin
    .from("public_carts")
    .select("id")
    .eq("id", cart_id)
    .eq("tenant_id", tenant_id)
    .eq("fingerprint_id", fingerprint)
    .single();

  if (!cart) {
    return NextResponse.json({ error: "Cart not found" }, { status: 404 });
  }

  const { data: cartItems } = await admin
    .from("public_cart_items")
    .select("product_id, quantity, price_snapshot, promotion_id")
    .eq("cart_id", cart_id);

  if (!cartItems || cartItems.length === 0) {
    return NextResponse.json(
      { error: "Cart is empty" },
      { status: 400 }
    );
  }

  const subtotal = cartItems.reduce(
    (sum, i) => sum + Number(i.price_snapshot) * i.quantity,
    0
  );
  const totalAmount = subtotal;

  const { data: order, error: orderError } = await admin
    .from("orders")
    .insert({
      tenant_id,
      status: "pending_pickup",
      subtotal,
      discount: 0,
      total: totalAmount,
      source: "public_store",
      customer_name: customer_name.trim(),
      customer_email: customer_email.trim(),
      customer_phone: customer_phone.trim(),
    })
    .select("id")
    .single();

  if (orderError || !order) {
    return NextResponse.json(
      { error: orderError?.message ?? "Error creating order" },
      { status: 500 }
    );
  }

  for (const item of cartItems) {
    const qty = item.quantity;
    const unitPrice = Number(item.price_snapshot);
    const totalPrice = unitPrice * qty;
    await admin.from("order_items").insert({
      order_id: order.id,
      product_id: item.product_id,
      quantity: qty,
      unit_price: unitPrice,
      subtotal: totalPrice,
      promotion_id: item.promotion_id ?? null,
    });
  }

  await admin.from("public_cart_items").delete().eq("cart_id", cart_id);

  const { data: slugRes } = await admin
    .from("tenants")
    .select("slug")
    .eq("id", tenant_id)
    .single();
  const slug = (slugRes as { slug: string } | null)?.slug ?? "";

  return NextResponse.json({
    success: true,
    order_id: order.id,
    redirect_url: `/sitio/${slug}/confirmacion?order_id=${order.id}`,
  });
}
