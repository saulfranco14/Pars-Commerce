/**
 * Domain service (S3): advance a settlement through its lifecycle.
 *
 *   open → closed → transfer_pending → transfer_confirmed
 *   (any non-terminal) → disputed
 *
 * The transition rules live here so no caller can jump states illegally
 * (e.g. mark a still-open settlement as transfer_confirmed without closing).
 * Server-only (service_role) — settlements are platform-managed.
 */
import type { SupabaseClient } from "@supabase/supabase-js";

import type { ServiceResult } from "@/features/settlement/services/createSettlement";

export type SettlementStatus =
  | "open"
  | "closed"
  | "transfer_pending"
  | "transfer_confirmed"
  | "disputed";

// Which statuses each status may move to. Encodes the whole lifecycle.
const ALLOWED_TRANSITIONS: Record<SettlementStatus, SettlementStatus[]> = {
  open: ["closed", "disputed"],
  closed: ["transfer_pending", "disputed"],
  transfer_pending: ["transfer_confirmed", "disputed"],
  transfer_confirmed: [], // terminal
  disputed: ["closed"], // a resolved dispute can re-enter the flow
};

export function canTransition(
  from: SettlementStatus,
  to: SettlementStatus,
): boolean {
  return ALLOWED_TRANSITIONS[from]?.includes(to) ?? false;
}

export interface AdvanceSettlementInput {
  settlementId: string;
  to: SettlementStatus;
  transferReference?: string;
  transferNote?: string;
  transferProofUrl?: string;
  confirmedBy?: string;
}

export async function advanceSettlement(
  admin: SupabaseClient,
  input: AdvanceSettlementInput,
): Promise<ServiceResult<{ status: SettlementStatus }>> {
  const { data: current, error: readErr } = await admin
    .from("settlements")
    .select("id, status")
    .eq("id", input.settlementId)
    .single();

  if (readErr || !current) {
    return {
      ok: false,
      error: { code: "not_found", message: "Liquidación no encontrada" },
    };
  }

  const from = current.status as SettlementStatus;
  if (!canTransition(from, input.to)) {
    return {
      ok: false,
      error: {
        code: "conflict",
        message: `Transición inválida: ${from} → ${input.to}`,
      },
    };
  }

  // Confirming a transfer must carry proof — otherwise "te pagué" is unauditable.
  if (input.to === "transfer_confirmed" && !input.transferReference?.trim()) {
    return {
      ok: false,
      error: {
        code: "validation",
        message: "Confirmar la transferencia requiere una referencia",
      },
    };
  }

  const now = new Date().toISOString();
  const updates: Record<string, unknown> = {
    status: input.to,
    updated_at: now,
  };
  if (input.to === "transfer_confirmed") {
    updates.transfer_reference = input.transferReference!.trim();
    updates.transfer_confirmed_at = now;
    if (input.confirmedBy) updates.transfer_confirmed_by = input.confirmedBy;
    // Delivery evidence: note is optional free text, proof is the receipt photo
    // URL (uploaded to the settlement-proofs bucket by the platform).
    if (input.transferNote?.trim())
      updates.transfer_note = input.transferNote.trim();
    if (input.transferProofUrl?.trim())
      updates.transfer_proof_url = input.transferProofUrl.trim();
  }

  const { error: updErr } = await admin
    .from("settlements")
    .update(updates)
    .eq("id", input.settlementId)
    // Guard against a concurrent transition: only move if still in `from`.
    .eq("status", from);

  if (updErr) {
    return { ok: false, error: { code: "internal", message: updErr.message } };
  }

  return { ok: true, data: { status: input.to } };
}
