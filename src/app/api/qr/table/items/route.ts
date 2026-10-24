/* eslint-disable @typescript-eslint/no-explicit-any -- additive promotion columns are represented in the local DB contract but nested PostgREST joins remain dynamic. */
import { NextResponse } from "next/server";

import { createAdminClient } from "@/lib/supabase/admin";
import { resolveUserError } from "@/lib/errors/resolveUserError";
import { identifyCustomer, normalizeMxPhone } from "@/lib/customers/customerIdentity";
import { priceOrder } from "@/lib/offers/orderPricing";
import { validateOrderStock } from "@/features/inventory/services/orderStockValidationService";

interface TableItemPayload {
  product_id: string;
  quantity: number;
  promotion_id?: string | null;
  offer_group_id?: string | null;
  is_shared?: boolean;
}

interface RequestBody {
  qr_token: string;
  display_name: string;
  customer_phone?: string;
  customer_note?: string;
  expected_total?: number;
  items: TableItemPayload[];
}

type LooseDb = { from: (table: string) => any; rpc: (name: string, args: Record<string, unknown>) => any };

function submitErrorMessage(message: string) {
  if (/table is full/i.test(message)) return "Esta mesa ya llegó a su capacidad. Pide al personal que la amplíe o te asigne otra.";
  if (/no longer accepts/i.test(message)) return "La cuenta ya está en proceso de pago y no acepta nuevos productos.";
  if (/product is not available|list price changed/i.test(message)) return "Uno de los productos cambió o ya no está disponible. Revisa el pedido e inténtalo de nuevo.";
  if (/promotion is no longer available/i.test(message)) return "Una promoción cambió antes de enviar. Revisa el nuevo total.";
  return resolveUserError({ message } as never, "supabase");
}

export async function POST(request: Request) {
  let body: RequestBody;
  try {
    body = (await request.json()) as RequestBody;
  } catch {
    return NextResponse.json({ error: "JSON inválido" }, { status: 400 });
  }

  const fingerprint = request.headers.get("x-fingerprint-id")?.trim();
  const displayName = body.display_name?.trim();
  const note = body.customer_note?.trim() || null;
  const items = Array.isArray(body.items)
    ? body.items.filter((item) => item.product_id && Number.isInteger(item.quantity) && item.quantity > 0)
    : [];
  if (!body.qr_token || !fingerprint || !displayName || items.length === 0) {
    return NextResponse.json({ error: "Nombre, mesa e items válidos son requeridos" }, { status: 400 });
  }
  if (displayName.length > 40) return NextResponse.json({ error: "El nombre no puede tener más de 40 caracteres" }, { status: 400 });
  if (note && note.length > 500) return NextResponse.json({ error: "Las indicaciones no pueden exceder 500 caracteres" }, { status: 400 });
  if (body.customer_phone?.trim() && !normalizeMxPhone(body.customer_phone)) {
    return NextResponse.json({ error: "Ingresa un teléfono válido o déjalo vacío por ahora" }, { status: 400 });
  }

  const admin = createAdminClient();
  const db = admin as unknown as LooseDb;
  const { data: qrCode } = await db.from("qr_codes")
    .select("id, tenant_id")
    .eq("token", body.qr_token)
    .eq("kind", "table")
    .eq("is_active", true)
    .is("archived_at", null)
    .maybeSingle();
  if (!qrCode) return NextResponse.json({ error: "Mesa no encontrada o inactiva" }, { status: 404 });

  const productIds = [...new Set(items.map((item) => item.product_id))];
  const [{ data: products }, { data: promotions }, { data: tenant }] = await Promise.all([
    db.from("products")
      .select("id, price, subcatalog_id")
      .eq("tenant_id", qrCode.tenant_id)
      .eq("is_public", true)
      .is("deleted_at", null)
      .in("id", productIds),
    db.from("promotions")
      .select("id, name, type, value, status, applies_to, product_ids, subcatalog_ids, bundle_product_ids, quantity, buy_quantity, pay_quantity, valid_from, valid_until, min_amount, sales_channels, promotion_items(product_id, quantity, position)")
      .eq("tenant_id", qrCode.tenant_id)
      .eq("status", "active")
      .contains("sales_channels", ["onsite"]),
    db.from("tenants").select("onsite_promotions_enabled").eq("id", qrCode.tenant_id).single(),
  ]);

  const pricing = priceOrder({
    products: (products ?? []).map((product: any) => ({ ...product, price: Number(product.price) })),
    promotions: (promotions ?? []).map((promotion: any) => ({ ...promotion, value: Number(promotion.value), min_amount: Number(promotion.min_amount ?? 0) })),
    intents: items.map((item) => ({
      productId: item.product_id,
      quantity: item.quantity,
      promotionId: item.promotion_id ?? null,
      offerGroupId: item.offer_group_id ?? null,
      isShared: item.is_shared === true,
    })),
    channel: "onsite",
    onsitePromotionsEnabled: tenant?.onsite_promotions_enabled !== false,
  });
  if (!pricing.ok) return NextResponse.json({ error: pricing.message, code: pricing.code }, { status: 409 });

  if (!Number.isFinite(body.expected_total) || Math.abs(Number(body.expected_total) - pricing.total) >= 0.005) {
    return NextResponse.json({
      error: "El precio del pedido cambió. Revisa el nuevo desglose antes de volver a enviar.",
      code: "cart_repriced",
      pricing: { total: pricing.total, list_total: pricing.listTotal, savings: pricing.savings, lines: pricing.lines },
    }, { status: 409 });
  }

  const stockValidation = await validateOrderStock(admin, qrCode.tenant_id, items.map((item) => ({ product_id: item.product_id, quantity: item.quantity })));
  if (!stockValidation.ok) return NextResponse.json({ error: stockValidation.message }, { status: 409 });

  const trustedLines = pricing.lines.map((line) => ({
    product_id: line.productId,
    quantity: line.quantity,
    unit_price: line.unitPrice,
    list_unit_price: line.listUnitPrice,
    promotion_id: line.promotionId,
    offer_group_id: line.offerGroupId,
    is_shared: line.isShared,
  }));
  const { data, error } = await db.rpc("submit_table_order_v2", {
    p_qr_token: body.qr_token,
    p_device_fingerprint: fingerprint,
    p_display_name: displayName,
    p_priced_items: trustedLines,
    p_customer_note: note,
  });
  const submitted = data as Array<{ order_id: string; device_id: string; batch_id: string; added_items: number }> | null;
  if (error || !submitted?.[0]) {
    const message = submitErrorMessage(error?.message ?? "No se pudo enviar el pedido");
    return NextResponse.json({ error: message }, { status: /capacidad|proceso de pago|disponible|promoción|cambió/i.test(message) ? 409 : 500 });
  }

  const result = submitted[0];
  let customerId: string | null = null;
  if (body.customer_phone?.trim()) {
    const identity = await identifyCustomer({ admin, tenantId: qrCode.tenant_id, displayName, phone: body.customer_phone, fingerprint });
    if ("error" in identity) return NextResponse.json({ error: identity.error }, { status: 422 });
    customerId = identity.customer.id;
    await admin.from("order_devices").update({ customer_id: customerId, updated_at: new Date().toISOString() } as never).eq("id", result.device_id);
  }
  const { data: order } = await admin.from("orders")
    .select("id, status, subtotal, total, paid_total, balance_due, fulfillment_status")
    .eq("id", result.order_id).single();

  return NextResponse.json({
    success: true,
    order,
    device_id: result.device_id,
    customer_id: customerId,
    batch_id: result.batch_id,
    added_items: result.added_items,
    pricing: { total: pricing.total, list_total: pricing.listTotal, savings: pricing.savings },
  });
}
