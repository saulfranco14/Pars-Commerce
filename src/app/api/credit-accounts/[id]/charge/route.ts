/* eslint-disable @typescript-eslint/no-explicit-any -- credit tables are introduced in the paired migration. */
import type { SupabaseClient } from "@supabase/supabase-js";
import { NextResponse } from "next/server";

import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";

export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { id } = await params;
  const body = await request.json() as { order_id?: string; note?: string };
  if (!body.order_id) return NextResponse.json({ error: "order_id es requerido." }, { status: 400 });
  const db = createAdminClient() as unknown as SupabaseClient<any>;
  const { data: account } = await db.from("customer_credit_accounts").select("tenant_id").eq("id", id).maybeSingle();
  if (!account) return NextResponse.json({ error: "Línea de crédito no encontrada." }, { status: 404 });
  const { data: membership } = await db.from("tenant_memberships").select("id").eq("tenant_id", account.tenant_id).eq("user_id", user.id).eq("status", "active").maybeSingle();
  if (!membership) return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  const { data, error } = await db.rpc("charge_order_to_credit", { p_account_id: id, p_order_id: body.order_id, p_actor_id: user.id, p_note: body.note?.trim() || null });
  if (error) return NextResponse.json({ error: error.message }, { status: 409 });
  return NextResponse.json(Array.isArray(data) ? data[0] : data);
}
