/* eslint-disable @typescript-eslint/no-explicit-any -- quote tables are added by paired migrations. */
import type { SupabaseClient } from "@supabase/supabase-js";
import { NextResponse } from "next/server";

import { requirePermission } from "@/lib/auth/requirePermission";
import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";

type Item = { product_id?: string; quantity?: number };

export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { id } = await params;
  const body = await request.json() as { items?: Item[] };
  const items = (body.items ?? []).map((item) => ({
    product_id: typeof item.product_id === "string" ? item.product_id : "",
    quantity: Math.floor(Number(item.quantity)),
  }));
  if (items.length === 0 || items.some((item) => !item.product_id || item.quantity <= 0)) {
    return NextResponse.json({ error: "Agrega al menos un producto o servicio válido." }, { status: 400 });
  }

  const db = createAdminClient() as unknown as SupabaseClient<any>;
  const { data: quote } = await db.from("quotes").select("tenant_id, status").eq("id", id).maybeSingle();
  if (!quote) return NextResponse.json({ error: "Cotización no encontrada." }, { status: 404 });
  if (!await requirePermission(user.id, quote.tenant_id, "order.take")) return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  if (quote.status !== "draft") return NextResponse.json({ error: "Sólo puedes editar una nueva versión antes de compartirla." }, { status: 409 });

  const { error } = await db.rpc("replace_quote_draft_items", {
    p_quote_id: id,
    p_actor_id: user.id,
    p_items: items,
  });
  if (error) return NextResponse.json({ error: error.message }, { status: 409 });
  const { data: updated, error: readError } = await db.from("quotes").select("*, customer:customers(id, name, email, phone), items:quote_items(*)").eq("id", id).eq("tenant_id", quote.tenant_id).single();
  if (readError) return NextResponse.json({ error: readError.message }, { status: 500 });
  return NextResponse.json(updated);
}
