/* eslint-disable @typescript-eslint/no-explicit-any -- public quote uses new migration tables. */
import type { SupabaseClient } from "@supabase/supabase-js";
import { NextResponse } from "next/server";

import { hashPublicDocumentToken } from "@/lib/publicDocumentToken";
import { createAdminClient } from "@/lib/supabase/admin";

async function quoteForToken(token: string) {
  const db = createAdminClient() as unknown as SupabaseClient<any>;
  const { data, error } = await db.from("quotes").select("id, tenant_id, quote_number, version, status, subtotal, discount, total, customer_note, valid_until, public_token_expires_at, customer:customers(name), tenant:tenants(name, logo_url), items:quote_items(name_snapshot, description_snapshot, image_url_snapshot, item_type, quantity, unit_price, subtotal, position)").eq("public_token_hash", hashPublicDocumentToken(token)).maybeSingle();
  if (error) throw error;
  return { db, quote: data };
}

export async function GET(_request: Request, { params }: { params: Promise<{ token: string }> }) {
  const { token } = await params;
  const { db, quote } = await quoteForToken(token);
  if (!quote) return NextResponse.json({ error: "Cotización no encontrada." }, { status: 404 });
  const expired = new Date(quote.valid_until) < new Date() || (quote.public_token_expires_at && new Date(quote.public_token_expires_at) < new Date());
  if (expired && !["converted", "accepted"].includes(quote.status)) {
    await db.from("quotes").update({ status: "expired", updated_at: new Date().toISOString() }).eq("id", quote.id);
    return NextResponse.json({ error: "Esta cotización venció." }, { status: 410 });
  }
  if (quote.status === "sent") await db.from("quotes").update({ status: "viewed", updated_at: new Date().toISOString() }).eq("id", quote.id);
  return NextResponse.json({ ...quote, status: quote.status === "sent" ? "viewed" : quote.status });
}

export async function POST(request: Request, { params }: { params: Promise<{ token: string }> }) {
  const { token } = await params;
  const body = await request.json() as { action?: "accept" | "reject" | "changes"; reason?: string };
  const { db, quote } = await quoteForToken(token);
  if (!quote) return NextResponse.json({ error: "Cotización no encontrada." }, { status: 404 });
  if (new Date(quote.valid_until) < new Date()) return NextResponse.json({ error: "Esta cotización venció." }, { status: 410 });
  if (body.action === "accept") {
    const { data, error } = await db.rpc("convert_quote_to_order", { p_quote_id: quote.id, p_actor_id: null, p_acceptance_source: "customer" });
    if (error) return NextResponse.json({ error: error.message }, { status: 409 });
    return NextResponse.json(Array.isArray(data) ? data[0] : data);
  }
  const status = body.action === "reject" ? "rejected" : body.action === "changes" ? "changes_requested" : null;
  if (!status) return NextResponse.json({ error: "Acción inválida." }, { status: 400 });
  await db.from("quotes").update({ status, updated_at: new Date().toISOString() }).eq("id", quote.id);
  await db.from("quote_events").insert({ quote_id: quote.id, event_type: status, source: "customer", reason: body.reason?.trim() || null });
  return NextResponse.json({ success: true, status });
}
