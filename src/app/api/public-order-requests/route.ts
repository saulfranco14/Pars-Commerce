import { NextResponse } from "next/server";

import { calcCartSubtotal, type CartItemRow } from "@/features/checkout/helpers/cartItemMappers";
import { createOrderItems } from "@/features/checkout/helpers/orderItems";
import { getFingerprint } from "@/features/checkout/helpers/checkoutRequest";
import { createAdminClient } from "@/lib/supabase/admin";

type RequestBody = {
  tenant_id?: string;
  cart_id?: string;
  customer_name?: string;
  customer_phone?: string;
  customer_email?: string;
  scheduled_for?: string | null;
};

const cleanPhone = (value: string) => value.replace(/\D/g, "");

async function findOrCreateCustomer(
  admin: ReturnType<typeof createAdminClient>,
  tenantId: string,
  name: string,
  phone: string,
  email?: string,
) {
  const normalizedPhone = cleanPhone(phone);
  const { data: existing } = await admin
    .from("customers")
    .select("id")
    .eq("tenant_id", tenantId)
    .eq("normalized_phone", normalizedPhone)
    .maybeSingle();
  if (existing) return existing.id;

  const { data: created, error } = await admin
    .from("customers")
    .insert({ tenant_id: tenantId, name, phone, normalized_phone: normalizedPhone, email: email || null })
    .select("id")
    .single();
  if (created) return created.id;
  // A simultaneous request with the same phone belongs to the same customer.
  if (error?.code === "23505") {
    const { data: concurrent } = await admin
      .from("customers")
      .select("id")
      .eq("tenant_id", tenantId)
      .eq("normalized_phone", normalizedPhone)
      .maybeSingle();
    if (concurrent) return concurrent.id;
  }
  throw new Error(error?.message ?? "No pudimos identificar al cliente.");
}

/** A request reserves nothing; staff explicitly accepts after re-validating stock. */
export async function POST(request: Request) {
  const fingerprint = getFingerprint(request);
  const idempotencyKey = request.headers.get("x-idempotency-key")?.trim();
  if (!fingerprint || !idempotencyKey || idempotencyKey.length > 120) {
    return NextResponse.json({ error: "Se requiere una clave de solicitud válida." }, { status: 400 });
  }
  const body = await request.json().catch(() => ({})) as RequestBody;
  const name = body.customer_name?.trim() ?? "";
  const phone = cleanPhone(body.customer_phone ?? "");
  const email = body.customer_email?.trim().toLowerCase() || undefined;
  if (!body.tenant_id || !body.cart_id || name.length < 2 || phone.length < 10 || phone.length > 15) {
    return NextResponse.json({ error: "Indica tu nombre y un teléfono válido para enviar la solicitud." }, { status: 400 });
  }
  if (email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return NextResponse.json({ error: "Revisa el correo o déjalo vacío." }, { status: 400 });
  }

  const admin = createAdminClient();
  const requestKey = `request:${body.tenant_id}:${idempotencyKey}`;
  const { data: prior } = await admin
    .from("orders")
    .select("id, public_tracking_token")
    .eq("public_request_key", requestKey)
    .maybeSingle();
  if (prior?.public_tracking_token) {
    return NextResponse.json({ success: true, order_id: prior.id, tracking_url: `/pedido/${prior.public_tracking_token}` });
  }

  const { data: tenant } = await admin
    .from("tenants")
    .select("id, accepting_orders")
    .eq("id", body.tenant_id)
    .eq("public_store_enabled", true)
    .maybeSingle();
  if (!tenant || tenant.accepting_orders === false) {
    return NextResponse.json({ error: "Este negocio no está recibiendo pedidos en este momento." }, { status: 409 });
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
    .eq("cart_id", cart.id);
  if (!cartItems?.length) return NextResponse.json({ error: "Tu carrito está vacío." }, { status: 400 });

  try {
    const customerId = await findOrCreateCustomer(admin, body.tenant_id, name, phone, email);
    const items = cartItems as CartItemRow[];
    const total = calcCartSubtotal(items);
    const { data: order, error } = await admin.from("orders").insert({
      tenant_id: body.tenant_id,
      status: "pending_acceptance",
      subtotal: total,
      discount: 0,
      total,
      source: "public_request",
      public_request_key: requestKey,
      customer_id: customerId,
      customer_name: name,
      customer_email: email ?? null,
      customer_phone: phone,
      paid_total: 0,
      balance_due: total,
      scheduled_for: body.scheduled_for ?? null,
      order_type: "takeaway",
      work_metadata: { public_cart_id: body.cart_id, request_state: "awaiting_business" },
    }).select("id, public_tracking_token").single();
    if (error || !order) {
      if (error?.code === "23505") {
        const { data: existing } = await admin.from("orders").select("id, public_tracking_token").eq("public_request_key", requestKey).maybeSingle();
        if (existing?.public_tracking_token) return NextResponse.json({ success: true, order_id: existing.id, tracking_url: `/pedido/${existing.public_tracking_token}` });
      }
      throw new Error(error?.message ?? "No pudimos crear la solicitud.");
    }
    try {
      await createOrderItems(admin, order.id, items);
    } catch (error) {
      await admin.from("orders").delete().eq("id", order.id);
      throw error;
    }
    return NextResponse.json({ success: true, order_id: order.id, tracking_url: `/pedido/${order.public_tracking_token}` }, { status: 201 });
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : "No pudimos enviar la solicitud." }, { status: 500 });
  }
}
