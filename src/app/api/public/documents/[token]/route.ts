/* eslint-disable @typescript-eslint/no-explicit-any -- private document tables ship in the paired migration. */
import type { SupabaseClient } from "@supabase/supabase-js";
import { createHash } from "crypto";
import { NextResponse } from "next/server";

import { hashPublicDocumentToken } from "@/lib/publicDocumentToken";
import { createAdminClient } from "@/lib/supabase/admin";

const MAX_ATTEMPTS = 30;
const WINDOW_MS = 60_000;
const attempts = new Map<string, { count: number; resetAt: number }>();

function isRateLimited(request: Request) {
  const ip = request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || request.headers.get("x-real-ip") || "unknown";
  const current = attempts.get(ip);
  const now = Date.now();
  if (!current || current.resetAt < now) { attempts.set(ip, { count: 1, resetAt: now + WINDOW_MS }); return false; }
  current.count += 1;
  return current.count > MAX_ATTEMPTS;
}

export async function GET(request: Request, { params }: { params: Promise<{ token: string }> }) {
  if (isRateLimited(request)) return NextResponse.json({ error: "Demasiadas solicitudes. Intenta nuevamente en un minuto." }, { status: 429 });
  const { token } = await params;
  const db = createAdminClient() as unknown as SupabaseClient<any>;
  const { data: link } = await db.from("customer_document_links").select("id, tenant_id, entity_type, entity_id, expires_at, revoked_at").eq("token_hash", hashPublicDocumentToken(token)).maybeSingle();
  if (!link || link.revoked_at || (link.expires_at && new Date(link.expires_at) < new Date())) return NextResponse.json({ error: "Este comprobante no está disponible." }, { status: 404 });
  const ip = request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || request.headers.get("x-real-ip") || "unknown";
  // The audit log intentionally stores only a one-way identifier, never a raw
  // customer IP address.
  void db.from("customer_document_link_accesses").insert({ document_link_id: link.id, ip_hash: createHash("sha256").update(ip).digest("hex"), user_agent: request.headers.get("user-agent")?.slice(0, 300) || null });
  if (link.entity_type === "order") {
    const { data: order } = await db.from("orders").select("id, order_number, status, subtotal, discount, total, payment_method, paid_at, completed_at, created_at, customer_name, tenant:tenants(name, logo_url), items:order_items(quantity, unit_price, subtotal, product:products(name, image_url))").eq("id", link.entity_id).eq("tenant_id", link.tenant_id).maybeSingle();
    if (!order) return NextResponse.json({ error: "Comprobante no encontrado." }, { status: 404 });
    return NextResponse.json({ kind: "order", order });
  }
  if (link.entity_type === "quote") {
    const { data: quote } = await db.from("quotes").select("quote_number, version, status, subtotal, discount, total, customer_note, valid_until, tenant:tenants(name, logo_url), items:quote_items(name_snapshot, image_url_snapshot, quantity, unit_price, subtotal)").eq("id", link.entity_id).eq("tenant_id", link.tenant_id).maybeSingle();
    if (!quote) return NextResponse.json({ error: "Cotización no encontrada." }, { status: 404 });
    return NextResponse.json({ kind: "quote", quote });
  }
  if (link.entity_type === "loan_payment") {
    const { data: payment } = await db.from("loan_payments").select("amount, payment_method, created_at, loan:loans(concept, amount_pending, customer:customers(name), tenant:tenants(name, logo_url))").eq("id", link.entity_id).eq("tenant_id", link.tenant_id).maybeSingle();
    if (!payment) return NextResponse.json({ error: "Abono no encontrado." }, { status: 404 });
    return NextResponse.json({ kind: "loan_payment", payment });
  }
  const { data: account } = await db.from("customer_credit_accounts").select("credit_limit, debt_balance, stored_balance, customer:customers(name), tenant:tenants(name, logo_url)").eq("id", link.entity_id).eq("tenant_id", link.tenant_id).maybeSingle();
  if (!account) return NextResponse.json({ error: "Saldo no encontrado." }, { status: 404 });
  return NextResponse.json({ kind: "credit_account", account });
}
