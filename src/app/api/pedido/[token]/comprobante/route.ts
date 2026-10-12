import { NextResponse } from "next/server";

import { createAdminClient } from "@/lib/supabase/admin";

type CommerceAdmin = { from: (table: string) => any; storage: any };
const MAX_PROOF_BYTES = 8 * 1024 * 1024;
const ALLOWED_TYPES = new Set(["image/jpeg", "image/png", "image/webp", "application/pdf"]);

export async function POST(request: Request, { params }: { params: Promise<{ token: string }> }) {
  const { token } = await params;
  const form = await request.formData();
  const file = form.get("proof");
  const amountClaimed = Number(form.get("amount") ?? 0);
  if (!(file instanceof File)) return NextResponse.json({ error: "Selecciona el comprobante de transferencia." }, { status: 400 });
  if (!ALLOWED_TYPES.has(file.type) || file.size > MAX_PROOF_BYTES) return NextResponse.json({ error: "Usa JPG, PNG, WEBP o PDF de máximo 8 MB." }, { status: 400 });

  const admin = createAdminClient() as unknown as CommerceAdmin;
  const { data: order } = await admin.from("orders").select("id, tenant_id, total, transfer_payment_method_id, payment_verification_status").eq("public_tracking_token", token).maybeSingle();
  if (!order) return NextResponse.json({ error: "Pedido no encontrado." }, { status: 404 });
  if (!order.transfer_payment_method_id || !["proof_required", "rejected"].includes(order.payment_verification_status)) {
    return NextResponse.json({ error: "Este pedido no requiere un comprobante en este momento." }, { status: 409 });
  }
  if (Number.isFinite(amountClaimed) && amountClaimed > 0 && Math.abs(amountClaimed - Number(order.total)) > 0.01) {
    return NextResponse.json({ error: "El monto del comprobante debe coincidir con el total del pedido." }, { status: 400 });
  }
  const extension = file.type === "application/pdf" ? "pdf" : file.type.split("/")[1] || "jpg";
  const path = `${order.tenant_id}/orders/${order.id}/transfer-${crypto.randomUUID()}.${extension}`;
  const { error: uploadError } = await admin.storage.from("order-payment-proofs").upload(path, file, { contentType: file.type, upsert: false });
  if (uploadError) return NextResponse.json({ error: uploadError.message }, { status: 500 });
  const now = new Date().toISOString();
  const { error: proofError } = await admin.from("order_transfer_proofs").insert({ order_id: order.id, payment_method_id: order.transfer_payment_method_id, storage_path: path, file_type: file.type, amount_claimed: Number.isFinite(amountClaimed) && amountClaimed > 0 ? amountClaimed : Number(order.total), status: "pending_review" });
  if (proofError) return NextResponse.json({ error: proofError.message }, { status: 500 });
  const { error: orderError } = await admin.from("orders").update({ payment_verification_status: "proof_submitted", updated_at: now }).eq("id", order.id);
  if (orderError) return NextResponse.json({ error: orderError.message }, { status: 500 });
  return NextResponse.json({ success: true, message: "Comprobante enviado. El negocio lo revisará antes de preparar tu pedido." });
}
