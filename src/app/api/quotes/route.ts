/* eslint-disable @typescript-eslint/no-explicit-any -- quote tables are added by the paired migration. */
import { randomUUID } from "crypto";
import type { SupabaseClient } from "@supabase/supabase-js";
import { NextResponse } from "next/server";

import { requirePermission } from "@/lib/auth/requirePermission";
import { createPublicDocumentToken } from "@/lib/publicDocumentToken";
import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";

type QuoteItemInput = { product_id: string; quantity: number };
type QuoteBody = {
  tenant_id?: string;
  customer_id?: string;
  customer?: { name?: string; email?: string; phone?: string };
  items?: QuoteItemInput[];
  discount?: number;
  valid_until?: string;
  internal_notes?: string;
  customer_note?: string;
};

function quoteNumber() {
  return `COT-${new Date().toISOString().slice(0, 10).replaceAll("-", "")}-${randomUUID().slice(0, 4).toUpperCase()}`;
}

export async function GET(request: Request) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const tenantId = new URL(request.url).searchParams.get("tenant_id");
  if (!tenantId) return NextResponse.json({ error: "tenant_id es requerido." }, { status: 400 });
  if (!await requirePermission(user.id, tenantId, "orders.read")) return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  const db = createAdminClient() as unknown as SupabaseClient<any>;
  const { data, error } = await db.from("quotes").select("*, customer:customers(id, name, email, phone), items:quote_items(*)").eq("tenant_id", tenantId).order("created_at", { ascending: false });
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data ?? []);
}

export async function POST(request: Request) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const body = await request.json() as QuoteBody;
  const tenantId = body.tenant_id;
  const items = body.items ?? [];
  if (!tenantId || items.length === 0) return NextResponse.json({ error: "Negocio y al menos un producto son requeridos." }, { status: 400 });
  if (!await requirePermission(user.id, tenantId, "order.take")) return NextResponse.json({ error: "Tu rol no puede crear cotizaciones." }, { status: 403 });
  const db = createAdminClient() as unknown as SupabaseClient<any>;
  let customerId = body.customer_id;
  if (!customerId && body.customer?.name?.trim()) {
    const { data: customer, error } = await db.from("customers").insert({ tenant_id: tenantId, name: body.customer.name.trim(), email: body.customer.email?.trim() || null, phone: body.customer.phone?.trim() || null }).select("id").single();
    if (error || !customer) return NextResponse.json({ error: error?.message ?? "No pudimos crear el cliente." }, { status: 400 });
    customerId = customer.id;
  }
  if (!customerId) return NextResponse.json({ error: "Selecciona o crea un cliente." }, { status: 400 });
  const { data: customer } = await db.from("customers").select("id").eq("id", customerId).eq("tenant_id", tenantId).maybeSingle();
  if (!customer) return NextResponse.json({ error: "Cliente no encontrado en este negocio." }, { status: 404 });
  const productIds = [...new Set(items.map((item) => item.product_id).filter(Boolean))];
  const { data: products, error: productsError } = await db.from("products").select("id, name, description, image_url, type, price, deleted_at").eq("tenant_id", tenantId).in("id", productIds);
  if (productsError) return NextResponse.json({ error: productsError.message }, { status: 500 });
  const productById = new Map((products ?? []).map((product: any) => [product.id, product]));
  const snapshots = items.map((item, position) => {
    const product = productById.get(item.product_id);
    const quantity = Math.floor(Number(item.quantity));
    if (!product || product.deleted_at || quantity <= 0) throw new Error("Uno de los productos ya no está disponible.");
    const unitPrice = Number(product.price);
    return { product_id: product.id, name_snapshot: product.name, description_snapshot: product.description, image_url_snapshot: product.image_url, item_type: product.type, quantity, unit_price: unitPrice, subtotal: unitPrice * quantity, position };
  });
  const subtotal = snapshots.reduce((sum, item) => sum + item.subtotal, 0);
  const discount = Math.max(0, Number(body.discount ?? 0));
  const total = Math.max(0, subtotal - discount);
  const { token, tokenHash } = createPublicDocumentToken();
  const validUntil = body.valid_until ? new Date(body.valid_until) : new Date(Date.now() + 7 * 86400000);
  if (Number.isNaN(validUntil.getTime()) || validUntil <= new Date()) return NextResponse.json({ error: "La vigencia debe estar en el futuro." }, { status: 400 });
  try {
    const { data: quote, error } = await db.from("quotes").insert({ tenant_id: tenantId, customer_id: customerId, quote_number: quoteNumber(), status: "ready_to_send", subtotal, discount, total, internal_notes: body.internal_notes?.trim() || null, customer_note: body.customer_note?.trim() || null, valid_until: validUntil.toISOString(), public_token_hash: tokenHash, public_token_expires_at: validUntil.toISOString(), created_by: user.id, updated_by: user.id }).select("*").single();
    if (error || !quote) throw new Error(error?.message ?? "No pudimos crear la cotización.");
    const { error: itemsError } = await db.from("quote_items").insert(snapshots.map((item) => ({ ...item, quote_id: quote.id })));
    if (itemsError) throw new Error(itemsError.message);
    await db.from("quote_events").insert({ quote_id: quote.id, actor_id: user.id, event_type: "created", source: "staff" });
    return NextResponse.json({ quote, public_url: `${new URL(request.url).origin}/cotizacion/${token}` }, { status: 201 });
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : "No pudimos crear la cotización." }, { status: 400 });
  }
}
