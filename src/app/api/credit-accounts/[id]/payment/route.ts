/* eslint-disable @typescript-eslint/no-explicit-any -- credit tables are introduced in the paired migration. */
import type { SupabaseClient } from "@supabase/supabase-js";
import { randomUUID } from "crypto";
import { NextResponse } from "next/server";

import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";

export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { id } = await params;
  const body = await request.json() as { amount?: number; overage_action?: "return_change" | "store_balance"; payment_method?: "efectivo" | "transferencia" | "tarjeta" | "otro"; note?: string; idempotency_key?: string };
  const amount = Number(body.amount);
  if (!Number.isFinite(amount) || amount <= 0 || !body.overage_action) return NextResponse.json({ error: "Indica el monto recibido y qué hacer con el excedente." }, { status: 400 });
  const db = createAdminClient() as unknown as SupabaseClient<any>;
  const { data: account } = await db.from("customer_credit_accounts").select("tenant_id").eq("id", id).maybeSingle();
  if (!account) return NextResponse.json({ error: "Línea de crédito no encontrada." }, { status: 404 });
  const { data: membership } = await db.from("tenant_memberships").select("id").eq("tenant_id", account.tenant_id).eq("user_id", user.id).eq("status", "active").maybeSingle();
  if (!membership) return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  const rawKey = body.idempotency_key || request.headers.get("idempotency-key") || randomUUID();
  const key = /^[0-9a-f]{8}-(?:[0-9a-f]{4}-){3}[0-9a-f]{12}$/i.test(rawKey) ? rawKey : randomUUID();
  const { data, error } = await db.rpc("apply_credit_payment", { p_account_id: id, p_received_amount: amount, p_overage_action: body.overage_action, p_payment_method: body.payment_method ?? "efectivo", p_actor_id: user.id, p_note: body.note?.trim() || null, p_idempotency_key: key });
  if (error) return NextResponse.json({ error: error.message }, { status: 409 });
  return NextResponse.json(Array.isArray(data) ? data[0] : data, { headers: { "Idempotency-Key": key } });
}
