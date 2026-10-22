/* eslint-disable @typescript-eslint/no-explicit-any -- Commerce schema types are regenerated after the migration rollout. */
import { getTenantRole } from "@/lib/auth/requirePermission";
import { roleHasPermission } from "@/lib/auth/permissions";

import type { createAdminClient } from "@/lib/supabase/admin";
import type { ServiceResult } from "@/features/qr/services/tablePaymentService";

type Admin = ReturnType<typeof createAdminClient>;

// Whoever attends the order or whoever collects money can check a transfer.
const REVIEW_PERMISSIONS = ["order.take", "payments.write"];

export interface TransferProofReview {
  userId: string;
  orderId: string;
  proofId: string;
  decision: "approve" | "reject";
  rejectionReason?: string;
}

/** Approve or reject a customer's transfer receipt; approving records the payment once. */
export async function reviewTransferProof(
  admin: Admin,
  input: TransferProofReview,
): Promise<ServiceResult<{ status: "approved" | "rejected" }>> {
  const reason = input.rejectionReason?.trim();
  if (input.decision === "reject" && !reason) {
    return { ok: false, error: { code: "validation", message: "Explica por qué se rechaza el comprobante." } };
  }
  const db = admin as unknown as { from: (table: string) => any };
  const { data: order } = await db.from("orders").select("id, tenant_id, total").eq("id", input.orderId).maybeSingle();
  if (!order) return { ok: false, error: { code: "not_found", message: "Orden no encontrada." } };

  const role = await getTenantRole(input.userId, order.tenant_id);
  if (!role || !REVIEW_PERMISSIONS.some((p) => roleHasPermission(role.roleName, role.permissions, p))) {
    return { ok: false, error: { code: "forbidden", message: "Tu rol no puede revisar comprobantes." } };
  }

  const now = new Date().toISOString();
  const approved = input.decision === "approve";
  // Only a receipt still pending moves: two people tapping at once can't record the payment twice.
  const { data: reviewed, error: proofError } = await db
    .from("order_transfer_proofs")
    .update({
      status: approved ? "approved" : "rejected",
      reviewed_by: input.userId,
      reviewed_at: now,
      rejection_reason: approved ? null : reason,
    })
    .eq("id", input.proofId)
    .eq("order_id", input.orderId)
    .eq("status", "pending_review")
    .select("id");
  if (proofError) return { ok: false, error: { code: "internal", message: proofError.message } };
  if (!reviewed?.length) {
    return { ok: false, error: { code: "conflict", message: "El comprobante ya fue revisado o no existe." } };
  }

  const orderPatch = approved
    ? { payment_verification_status: "approved", status: "pending_acceptance", paid_total: order.total, balance_due: 0, updated_at: now }
    : { payment_verification_status: "rejected", status: "pending_payment", updated_at: now };
  const { error: orderError } = await db.from("orders").update(orderPatch).eq("id", input.orderId);
  if (orderError) return { ok: false, error: { code: "internal", message: orderError.message } };

  if (approved) {
    await db.from("payments").insert({
      order_id: input.orderId,
      provider: "bank_transfer",
      status: "approved",
      amount: order.total,
      payment_kind: "single",
      metadata: { proof_id: input.proofId, verified_by: input.userId },
    });
  }
  return { ok: true, data: { status: approved ? "approved" : "rejected" } };
}
