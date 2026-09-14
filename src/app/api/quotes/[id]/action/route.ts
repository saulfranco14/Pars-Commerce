/* eslint-disable @typescript-eslint/no-explicit-any -- quote tables ship in the paired migration. */
import type { SupabaseClient } from "@supabase/supabase-js";
import { NextResponse } from "next/server";

import { requirePermission } from "@/lib/auth/requirePermission";
import { createPublicDocumentToken } from "@/lib/publicDocumentToken";
import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";

export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { id } = await params;
  const body = await request.json() as { action?: string; reason?: string };
  const db = createAdminClient() as unknown as SupabaseClient<any>;
  const { data: quote } = await db.from("quotes").select("id, tenant_id, status, valid_until").eq("id", id).maybeSingle();
  if (!quote) return NextResponse.json({ error: "Cotización no encontrada." }, { status: 404 });
  if (!await requirePermission(user.id, quote.tenant_id, "order.take")) return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  if (body.action === "share") {
    const { token, tokenHash } = createPublicDocumentToken();
    const expiresAt = quote.valid_until;
    await db.from("quotes").update({ status: "sent", public_token_hash: tokenHash, public_token_expires_at: expiresAt, updated_by: user.id, updated_at: new Date().toISOString() }).eq("id", id);
    await db.from("quote_events").insert({ quote_id: id, actor_id: user.id, event_type: "share_opened", source: "staff" });
    return NextResponse.json({ public_url: `${new URL(request.url).origin}/cotizacion/${token}` });
  }
  const statusMap: Record<string, string> = { review: "internal_review", ready: "ready_to_send", changes: "changes_requested", cancel: "cancelled", accept: "accepted", reject: "rejected" };
  const next = body.action ? statusMap[body.action] : undefined;
  if (!next) return NextResponse.json({ error: "Acción inválida." }, { status: 400 });
  if (body.action === "accept") {
    const { data: converted, error } = await db.rpc("convert_quote_to_order", { p_quote_id: id, p_actor_id: user.id, p_acceptance_source: "staff" });
    if (error) return NextResponse.json({ error: error.message }, { status: 409 });
    return NextResponse.json(Array.isArray(converted) ? converted[0] : converted);
  }
  const { error } = await db.from("quotes").update({ status: next, updated_by: user.id, updated_at: new Date().toISOString() }).eq("id", id);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  await db.from("quote_events").insert({ quote_id: id, actor_id: user.id, event_type: next, source: "staff", reason: body.reason?.trim() || null });
  return NextResponse.json({ success: true, status: next });
}
