import { BOARD_COLUMNS, BOARD_COLUMN_LIMIT, BOARD_REGISTERED_DAYS } from "@/features/growth/constants/leadPipeline";
import { internalError, rpcError } from "@/features/growth/services/growthDb";
import { LEAD_COLUMNS, withOwnerNames } from "@/features/growth/services/leadService";

import type { GrowthDb } from "@/features/growth/services/growthDb";
import type { BoardColumn, BoardColumnKey, BoardZone, FollowUpInput, GrowthLead, LeadBoard, PipelineCounts } from "@/features/growth/interfaces/lead";
import type { GrowthActor } from "@/features/growth/interfaces/member";
import type { ServiceResult } from "@/features/qr/services/tablePaymentService";

/** Every operator move (cita, recordatorio, pausa, nota) goes through growth_follow_up, which checks the pipeline and the owner. */
export async function followUp(db: GrowthDb, actor: GrowthActor, leadId: string, input: FollowUpInput): Promise<ServiceResult<GrowthLead>> {
  const { data, error } = await db.rpc("growth_follow_up", {
    p_lead_id: leadId,
    p_action: input.action,
    p_at: input.at ?? null,
    p_note: input.note ?? null,
    p_actor_id: actor.userId,
  });
  if (error) return rpcError(error.message);
  return { ok: true, data: data as GrowthLead };
}

/** Prospectors only see their own board; coordinators see everyone's or one person's. */
function boardOwner(actor: GrowthActor, zone: BoardZone): string | null {
  if (actor.role === "prospector" || zone.owner === "me") return actor.userId;
  return zone.owner && zone.owner !== "all" ? zone.owner : null;
}

export async function pipelineCounts(db: GrowthDb, actor: GrowthActor, zone: BoardZone): Promise<ServiceResult<PipelineCounts>> {
  const { data, error } = await db.rpc("growth_pipeline_counts", {
    p_municipio: zone.municipio ?? null,
    p_giro: zone.giro ?? null,
    p_workspace_id: actor.workspaceId,
    p_owner_id: boardOwner(actor, zone),
  });
  if (error) return internalError(error.message);
  return { ok: true, data: data as PipelineCounts };
}

async function boardColumn(db: GrowthDb, actor: GrowthActor, key: BoardColumnKey, zone: BoardZone, total: number): Promise<BoardColumn> {
  let query = db.from("growth_leads").select(LEAD_COLUMNS).eq("workspace_id", actor.workspaceId).eq("stage", key);
  const owner = boardOwner(actor, zone);
  if (owner) query = query.eq("owner_user_id", owner);
  if (zone.municipio) query = query.eq("municipio", zone.municipio);
  if (zone.giro) query = query.eq("giro", zone.giro);
  query = key === "registrado"
    ? query.gt("last_activity_at", new Date(Date.now() - BOARD_REGISTERED_DAYS * 86_400_000).toISOString()).order("last_activity_at", { ascending: false })
    : query.order("next_step_at", { nullsFirst: false }).order("last_activity_at", { ascending: false });
  const { data } = await query.limit(BOARD_COLUMN_LIMIT);
  return { key, total, leads: await withOwnerNames(db, actor.workspaceId, (data ?? []) as GrowthLead[]) };
}

/** One column per follow-up stage, most urgent first. */
export async function loadBoard(db: GrowthDb, actor: GrowthActor, zone: BoardZone): Promise<ServiceResult<LeadBoard>> {
  const counts = await pipelineCounts(db, actor, zone);
  if (!counts.ok) return counts;
  const columns = await Promise.all(BOARD_COLUMNS.map((key) => boardColumn(db, actor, key, zone, counts.data[key])));
  return { ok: true, data: { columns, counts: counts.data } };
}
