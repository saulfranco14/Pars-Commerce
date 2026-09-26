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
  const admin = createAdminClient();
  const { data: order } = await admin.from("orders").select("id, tenant_id, status").eq("id", id).maybeSingle();
  if (!order) return NextResponse.json({ error: "Pedido no encontrado." }, { status: 404 });
  if (!await requirePermission(user.id, order.tenant_id, "order.take")) return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  if (order.status !== "pending_acceptance") return NextResponse.json({ error: "Este pedido ya fue atendido." }, { status: 409 });
  const reason = body.reason?.trim().slice(0, 500) || "El negocio no puede atender este pedido por ahora.";
  const { error } = await admin.from("orders").update({ status: "cancelled", rejected_at: new Date().toISOString(), rejection_reason: reason, cancel_reason: reason, updated_at: new Date().toISOString() }).eq("id", id).eq("status", "pending_acceptance");
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ success: true });
}
