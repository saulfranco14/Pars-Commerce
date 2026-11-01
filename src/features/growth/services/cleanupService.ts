import { internalError } from "@/features/growth/services/growthDb";
import { memberNames } from "@/features/growth/services/memberService";

import type { GrowthDb } from "@/features/growth/services/growthDb";
import type { ColdLead } from "@/features/growth/interfaces/cleanup";
import type { GrowthActor } from "@/features/growth/interfaces/member";
import type { ServiceResult } from "@/features/qr/services/tablePaymentService";

/** Contacted at least `minDays` ago and never opened their store nor answered. */
export async function coldLeads(db: GrowthDb, actor: GrowthActor, options: { minDays: number; owner?: string }): Promise<ServiceResult<ColdLead[]>> {
  const { data, error } = await db.rpc("growth_cold_leads", {
    p_workspace_id: actor.workspaceId,
    p_actor_id: actor.userId,
    p_min_days: options.minDays,
    p_owner: options.owner ?? null,
  });
  if (error) return internalError(error.message);
  const rows = (data ?? []) as Omit<ColdLead, "owner_name">[];
  const names = await memberNames(db, actor.workspaceId, rows.map((row) => row.owner_user_id ?? ""));
  return { ok: true, data: rows.map((row) => ({ ...row, owner_name: row.owner_user_id ? names[row.owner_user_id] ?? null : null })) };
}

/** Drops many leads with one reason; a lead someone else works is left as it is. */
export async function dropLeads(db: GrowthDb, actor: GrowthActor, leadIds: string[], reason: string): Promise<ServiceResult<{ dropped: number }>> {
  const { data, error } = await db.rpc("growth_bulk_drop", {
    p_workspace_id: actor.workspaceId,
    p_actor_id: actor.userId,
    p_lead_ids: leadIds,
    p_reason: reason,
  });
  if (error) {
    if (error.message.includes("TOO_MANY")) return { ok: false, error: { code: "validation", message: "Son demasiados de una vez: máximo 1,000." } };
    return internalError(error.message);
  }
  return { ok: true, data: { dropped: Number(data ?? 0) } };
}
