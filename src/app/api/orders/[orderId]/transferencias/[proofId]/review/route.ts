import { NextResponse } from "next/server";

import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { requirePermission } from "@/lib/auth/requirePermission";

type CommerceAdmin = { from: (table: string) => any };

export async function POST(request: Request, { params }: { params: Promise<{ orderId: string; proofId: string }> }) {
  const { orderId, proofId } = await params;
  const body = await request.json() as { decision?: "approve" | "reject"; rejection_reason?: string };
  if (body.decision !== "approve" && body.decision !== "reject") return NextResponse.json({ error: "Indica si el comprobante se aprueba o rechaza." }, { status: 400 });
  if (body.decision === "reject" && !body.rejection_reason?.trim()) return NextResponse.json({ error: "Explica por qué se rechaza el comprobante." }, { status: 400 });
  const session = await createClient();
  const { data: { user } } = await session.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const admin = createAdminClient() as unknown as CommerceAdmin;
  const { data: order } = await admin.from("orders").select("id, tenant_id, total").eq("id", orderId).maybeSingle();
  if (!order) return NextResponse.json({ error: "Orden no encontrada." }, { status: 404 });
  if (!await requirePermission(user.id, order.tenant_id, "order.take")) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }
  const { data: proof } = await admin.from("order_transfer_proofs").select("id, status").eq("id", proofId).eq("order_id", orderId).maybeSingle();
  if (!proof || proof.status !== "pending_review") return NextResponse.json({ error: "El comprobante ya fue revisado o no existe." }, { status: 409 });
  const now = new Date().toISOString();
  const approved = body.decision === "approve";
  const { error: proofError } = await admin.from("order_transfer_proofs").update({ status: approved ? "approved" : "rejected", reviewed_by: user.id, reviewed_at: now, rejection_reason: approved ? null : body.rejection_reason?.trim() }).eq("id", proofId);
  if (proofError) return NextResponse.json({ error: proofError.message }, { status: 500 });
  const orderPatch = approved
    ? { payment_verification_status: "approved", status: "pending_acceptance", paid_total: order.total, balance_due: 0, updated_at: now }
    : { payment_verification_status: "rejected", status: "pending_payment", updated_at: now };
  const { error: orderError } = await admin.from("orders").update(orderPatch).eq("id", orderId);
  if (orderError) return NextResponse.json({ error: orderError.message }, { status: 500 });
  if (approved) await admin.from("payments").insert({ order_id: orderId, provider: "bank_transfer", status: "approved", amount: order.total, payment_kind: "single", metadata: { proof_id: proofId, verified_by: user.id } });
  return NextResponse.json({ success: true, status: approved ? "approved" : "rejected" });
}
