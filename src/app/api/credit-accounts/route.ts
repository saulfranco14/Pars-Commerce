/* eslint-disable @typescript-eslint/no-explicit-any -- credit tables are introduced in the paired migration. */
import type { SupabaseClient } from "@supabase/supabase-js";
import { NextResponse } from "next/server";

import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";

async function isOwner(db: SupabaseClient<any>, userId: string, tenantId: string) {
  const { data } = await db.from("tenant_memberships").select("role:tenant_roles(name), status").eq("tenant_id", tenantId).eq("user_id", userId).maybeSingle();
  const role = Array.isArray(data?.role) ? data.role[0] : data?.role;
  return data?.status === "active" && role?.name === "owner";
}

export async function GET(request: Request) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const params = new URL(request.url).searchParams;
  const tenantId = params.get("tenant_id");
  const customerId = params.get("customer_id");
  const accountId = params.get("account_id");
  if (!tenantId) return NextResponse.json({ error: "tenant_id es requerido." }, { status: 400 });
  const db = createAdminClient() as unknown as SupabaseClient<any>;
  const { data: membership } = await db.from("tenant_memberships").select("id, status").eq("tenant_id", tenantId).eq("user_id", user.id).eq("status", "active").maybeSingle();
  if (!membership) return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  let query = db.from("customer_credit_accounts").select("*, customer:customers(id, name, phone, email), movements:customer_credit_movements(*) ").eq("tenant_id", tenantId).order("created_at", { referencedTable: "customer_credit_movements", ascending: false });
  if (accountId) query = query.eq("id", accountId);
  if (customerId) query = query.eq("customer_id", customerId);
  const { data, error } = await query;
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data ?? []);
}

export async function POST(request: Request) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const body = await request.json() as { tenant_id?: string; customer_id?: string; credit_limit?: number; initial_stored_balance?: number; internal_notes?: string };
  if (!body.tenant_id || !body.customer_id || !Number.isFinite(Number(body.credit_limit)) || Number(body.credit_limit) < 0) return NextResponse.json({ error: "Cliente, negocio y límite válido son requeridos." }, { status: 400 });
  const db = createAdminClient() as unknown as SupabaseClient<any>;
  if (!await isOwner(db, user.id, body.tenant_id)) return NextResponse.json({ error: "Sólo el propietario puede autorizar una línea de crédito." }, { status: 403 });
  const initialStored = Math.max(0, Number(body.initial_stored_balance ?? 0));
  const { data: account, error } = await db.from("customer_credit_accounts").insert({ tenant_id: body.tenant_id, customer_id: body.customer_id, credit_limit: Number(body.credit_limit), stored_balance: initialStored, internal_notes: body.internal_notes?.trim() || null, created_by: user.id, updated_by: user.id }).select("*").single();
  if (error || !account) return NextResponse.json({ error: error?.message ?? "No pudimos crear la línea de crédito." }, { status: 409 });
  if (initialStored > 0) await db.from("customer_credit_movements").insert({ account_id: account.id, tenant_id: body.tenant_id, movement_type: "deposit", stored_balance_delta: initialStored, received_amount: initialStored, debt_after: 0, stored_balance_after: initialStored, note: "Saldo inicial a favor", created_by: user.id });
  return NextResponse.json(account, { status: 201 });
}
