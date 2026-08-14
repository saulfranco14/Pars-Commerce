/* eslint-disable @typescript-eslint/no-explicit-any -- new commercial columns are delivered in this release migration. */
import { NextResponse } from "next/server";

import { createAdminClient } from "@/lib/supabase/admin";
import { calcCartSubtotal, type CartItemRow } from "@/features/checkout/helpers/cartItemMappers";
import { ensureCustomer } from "@/features/checkout/helpers/ensureCustomer";
import { createOrderItems } from "@/features/checkout/helpers/orderItems";
import { getFingerprint } from "@/features/checkout/helpers/checkoutRequest";
import { validateOrderStock } from "@/features/inventory/services/orderStockValidationService";
import { checkoutFormSchema } from "@/features/orders/validations/checkoutForm";

const E164 = /^\+[1-9]\d{7,14}$/;

function toWhatsAppUrl(phone: string, orderNumber: string): string {
  const message = `Hola, solicité el pedido #${orderNumber} desde la tienda. ¿Me ayudan a confirmarlo?`;
  return `https://wa.me/${phone.slice(1)}?text=${encodeURIComponent(message)}`;
}

/**
 * Creates exactly one unpaid order before opening click-to-chat. The order is
 * the source of truth; opening WhatsApp only appends a communication event.
 */
export async function POST(request: Request) {
  const fingerprint = getFingerprint(request);
  const idempotencyKey = request.headers.get("x-idempotency-key")?.trim();
  if (!fingerprint || !idempotencyKey || idempotencyKey.length > 120) {
    return NextResponse.json({ error: "Se requiere una clave de intento válida." }, { status: 400 });
  }

  let body: { tenant_id?: string; cart_id?: string; customer_name?: string; customer_email?: string; customer_phone?: string; scheduled_for?: string | null };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "JSON inválido." }, { status: 400 });
  }
  if (!body.tenant_id || !body.cart_id) {
    return NextResponse.json({ error: "tenant_id y cart_id son requeridos." }, { status: 400 });
  }

  let customer: { customer_name: string; customer_email: string; customer_phone?: string };
  try {
    customer = await checkoutFormSchema.validate({
      customer_name: body.customer_name?.trim(),
      customer_email: body.customer_email?.trim(),
      customer_phone: body.customer_phone?.trim(),
    }, { stripUnknown: true });
  } catch {
    return NextResponse.json({ error: "Revisa los datos de contacto." }, { status: 400 });
  }

  const admin = createAdminClient() as any;
  const { data: tenant } = await admin
    .from("tenants")
    .select("id, slug, name, whatsapp_phone, whatsapp_orders_enabled, accepting_orders")
    .eq("id", body.tenant_id)
    .eq("public_store_enabled", true)
    .maybeSingle();
  if (!tenant) return NextResponse.json({ error: "Tienda no encontrada." }, { status: 404 });
  if (tenant.accepting_orders === false || !tenant.whatsapp_orders_enabled) {
    return NextResponse.json({ error: "Esta tienda no está recibiendo pedidos por WhatsApp." }, { status: 409 });
  }
  if (!tenant.whatsapp_phone || !E164.test(tenant.whatsapp_phone.trim())) {
    return NextResponse.json({ error: "La tienda no tiene un número de WhatsApp internacional válido." }, { status: 409 });
  }

  const requestKey = `whatsapp:${body.tenant_id}:${idempotencyKey}`;
  const { data: previous } = await admin
    .from("orders")
    .select("id, public_tracking_token")
    .eq("tenant_id", body.tenant_id)
    .eq("whatsapp_request_key", requestKey)
    .maybeSingle();
  if (previous) {
    return NextResponse.json({
      success: true,
      order_id: previous.id,
      tracking_token: previous.public_tracking_token,
      whatsapp_url: toWhatsAppUrl(tenant.whatsapp_phone.trim(), previous.id.slice(0, 8).toUpperCase()),
    });
  }

  const { data: cart } = await admin
    .from("public_carts")
    .select("id")
    .eq("id", body.cart_id)
    .eq("tenant_id", body.tenant_id)
    .eq("fingerprint_id", fingerprint)
    .maybeSingle();
  if (!cart) return NextResponse.json({ error: "Carrito no encontrado." }, { status: 404 });

  const { data: cartItems } = await admin
    .from("public_cart_items")
    .select("product_id, quantity, price_snapshot, promotion_id, product:products(id, name, image_url)")
    .eq("cart_id", body.cart_id);
  if (!cartItems?.length) return NextResponse.json({ error: "El carrito está vacío." }, { status: 400 });
  const items = cartItems as CartItemRow[];
  const stock = await validateOrderStock(admin, body.tenant_id, items);
  if (!stock.ok) return NextResponse.json({ error: stock.message }, { status: 409 });

  const customerId = await ensureCustomer(admin, body.tenant_id, customer.customer_name, customer.customer_email, customer.customer_phone);
  const total = calcCartSubtotal(items);
  const { data: order, error: orderError } = await admin
    .from("orders")
    .insert({
      tenant_id: body.tenant_id,
      status: "assigned",
      subtotal: total,
      discount: 0,
      total,
      source: "whatsapp",
      whatsapp_request_key: requestKey,
      customer_id: customerId,
      customer_name: customer.customer_name,
      customer_email: customer.customer_email.toLowerCase(),
      customer_phone: customer.customer_phone?.trim() || null,
      paid_total: 0,
      balance_due: total,
      scheduled_for: body.scheduled_for || null,
      order_type: "takeaway",
      work_metadata: { channel: "whatsapp", public_cart_id: body.cart_id },
    })
    .select("id, public_tracking_token")
    .single();
  if (orderError || !order) {
    // A retry racing the first request must return that order, not create a second one.
    if (orderError?.code === "23505") {
      const { data: existing } = await admin.from("orders").select("id, public_tracking_token").eq("tenant_id", body.tenant_id).eq("whatsapp_request_key", requestKey).maybeSingle();
      if (existing) return NextResponse.json({ success: true, order_id: existing.id, tracking_token: existing.public_tracking_token, whatsapp_url: toWhatsAppUrl(tenant.whatsapp_phone.trim(), existing.id.slice(0, 8).toUpperCase()) });
    }
    return NextResponse.json({ error: orderError?.message ?? "No se pudo crear el pedido." }, { status: 500 });
  }
  try {
    await createOrderItems(admin, order.id, items);
    await admin.from("communication_events").insert({
      tenant_id: body.tenant_id,
      channel: "whatsapp",
      entity_type: "order",
      entity_id: order.id,
      event_type: "order_created",
      metadata: { source: "public_store", tracking_token: order.public_tracking_token },
    });
  } catch (error) {
    // Order and items must not diverge. A server-side transaction/RPC is the
    // next hardening step once public checkout moves to the same database RPC.
    await admin.from("orders").delete().eq("id", order.id);
    return NextResponse.json({ error: error instanceof Error ? error.message : "No se pudo preparar el pedido." }, { status: 500 });
  }

  return NextResponse.json({
    success: true,
    order_id: order.id,
    tracking_token: order.public_tracking_token,
    whatsapp_url: toWhatsAppUrl(tenant.whatsapp_phone.trim(), order.id.slice(0, 8).toUpperCase()),
  });
}
