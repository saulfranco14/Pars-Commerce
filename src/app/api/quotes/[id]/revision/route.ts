/* eslint-disable @typescript-eslint/no-explicit-any -- quote tables ship in the paired migration. */
import type { SupabaseClient } from "@supabase/supabase-js";
import { NextResponse } from "next/server";

import { requirePermission } from "@/lib/auth/requirePermission";
import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";

export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { id } = await params;
  const body = await request.json().catch(() => ({})) as { reason?: string };
  const db = createAdminClient() as unknown as SupabaseClient<any>;
  const { data: quote } = await db.from("quotes").select("tenant_id").eq("id", id).maybeSingle();
  if (!quote) return NextResponse.json({ error: "Cotización no encontrada." }, { status: 404 });
  if (!await requirePermission(user.id, quote.tenant_id, "order.take")) return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  const { data, error } = await db.rpc("create_quote_revision", {
    p_quote_id: id,
    p_actor_id: user.id,
    p_reason: body.reason?.trim() || null,
  });
  if (error) return NextResponse.json({ error: error.message }, { status: 409 });
  const result = Array.isArray(data) ? data[0] : data;
  return NextResponse.json(result, { status: 201 });
}
