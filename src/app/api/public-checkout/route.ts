import { createAdminClient } from "@/lib/supabase/admin";
import { preferenceClient } from "@/lib/mercadopago";
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

  const { tenant_id, cart_id, customer_name, customer_email, customer_phone } =
    body;

  if (!tenant_id || !cart_id) {
    return NextResponse.json(
      { error: "tenant_id and cart_id are required" },
      { status: 400 }
    );
  }

  if (!customer_name?.trim() || !customer_email?.trim()) {
    return NextResponse.json(
      { error: "customer_name and customer_email are required" },
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
    .select("product_id, quantity, price_snapshot, product:products(id, name)")
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
  const orderNumber = `ORD-${Date.now()}-${Math.floor(Math.random() * 1000)}`;

  const { data: order, error: orderError } = await admin
    .from("orders")
    .insert({
      order_number: orderNumber,
      tenant_id,
      user_id: null,
      status: "pending_payment",
      total_amount: totalAmount,
      subtotal,
      tax: 0,
      discount: 0,
      payment_status: "pending",
      source: "public_store",
      customer_name: customer_name.trim(),
      customer_email: customer_email.trim(),
      customer_phone: customer_phone?.trim() || null,
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
      total_price: totalPrice,
      subtotal: totalPrice,
      status: "pending",
    });
  }

  const mpItems = cartItems.map((item: { product: { id: string; name: string } | null; quantity: number; price_snapshot: number }) => ({
    id: item.product?.id ?? "unknown",
    title: (item.product as { name: string })?.name ?? "Producto",
    quantity: item.quantity,
    unit_price: Number(item.price_snapshot),
    currency_id: "MXN",
  }));

  const origin =
    request.headers.get("origin") ??
    request.headers.get("referer")?.replace(/\/[^/]*$/, "") ??
    "http://localhost:3000";

  const slugRes = await admin
    .from("tenants")
    .select("slug")
    .eq("id", tenant_id)
    .single();
  const slug = (slugRes.data as { slug: string } | null)?.slug ?? "";

  let preferenceRes;
  try {
    preferenceRes = await preferenceClient.create({
    body: {
      items: mpItems,
      external_reference: order.id,
      back_urls: {
        success: `${origin}/sitio/${slug}/confirmacion?status=success&order_id=${order.id}`,
        failure: `${origin}/sitio/${slug}/confirmacion?status=failure&order_id=${order.id}`,
        pending: `${origin}/sitio/${slug}/confirmacion?status=pending&order_id=${order.id}`,
      },
      auto_return: "approved",
      notification_url: `${origin}/api/mercadopago/webhook`,
      payer: { email: customer_email.trim() },
    },
  });
  } catch (err) {
    console.error("MercadoPago preference error:", err);
    return NextResponse.json(
      { error: "Error al generar link de pago" },
      { status: 500 }
    );
  }

  const paymentLink = preferenceRes.init_point ?? preferenceRes.sandbox_init_point;

  if (!paymentLink) {
    return NextResponse.json(
      { error: "MercadoPago no devolvió link de pago" },
      { status: 502 }
    );
  }

  await admin
    .from("orders")
    .update({
      payment_link: paymentLink,
      mp_preference_id: preferenceRes.id,
      updated_at: new Date().toISOString(),
    })
    .eq("id", order.id);

  await admin.from("payments").insert({
    order_id: order.id,
    provider: "mercadopago",
    external_id: preferenceRes.id,
    status: "pending",
    amount: totalAmount,
    metadata: { preference_id: preferenceRes.id, init_point: paymentLink },
  });

  await admin.from("public_cart_items").delete().eq("cart_id", cart_id);

  return NextResponse.json({
    payment_link: paymentLink,
    order_id: order.id,
  });
}
