import { BOARD_COLUMNS, BOARD_COLUMN_LIMIT, BOARD_REGISTERED_DAYS } from "@/features/growth/constants/leadPipeline";
import { internalError, rpcError } from "@/features/growth/services/growthDb";
import { LEAD_COLUMNS } from "@/features/growth/services/leadService";

import type { GrowthDb } from "@/features/growth/services/growthDb";
import type { BoardColumn, BoardColumnKey, FollowUpInput, GrowthLead, LeadBoard, PipelineCounts } from "@/features/growth/interfaces/lead";
import type { ServiceResult } from "@/features/qr/services/tablePaymentService";

/** Every operator move (cita, recordatorio, pausa, nota) goes through growth_follow_up, which checks the pipeline. */
export async function followUp(db: GrowthDb, leadId: string, input: FollowUpInput): Promise<ServiceResult<GrowthLead>> {
  const { data, error } = await db.rpc("growth_follow_up", {
    p_lead_id: leadId,
    p_action: input.action,
    p_at: input.at ?? null,
    p_note: input.note ?? null,
  });
  if (error) return rpcError(error.message);
  return { ok: true, data: data as GrowthLead };
}

export async function pipelineCounts(db: GrowthDb, zone: { municipio?: string; giro?: string }): Promise<ServiceResult<PipelineCounts>> {
  const { data, error } = await db.rpc("growth_pipeline_counts", { p_municipio: zone.municipio ?? null, p_giro: zone.giro ?? null });
  if (error) return internalError(error.message);
  return { ok: true, data: data as PipelineCounts };
}

async function boardColumn(db: GrowthDb, key: BoardColumnKey, zone: { municipio?: string; giro?: string }, total: number): Promise<BoardColumn> {
  let query = db.from("growth_leads").select(LEAD_COLUMNS).eq("stage", key);
  if (zone.municipio) query = query.eq("municipio", zone.municipio);
  if (zone.giro) query = query.eq("giro", zone.giro);
  query = key === "registrado"
    ? query.gt("last_activity_at", new Date(Date.now() - BOARD_REGISTERED_DAYS * 86_400_000).toISOString()).order("last_activity_at", { ascending: false })
    : query.order("next_step_at", { nullsFirst: false }).order("last_activity_at", { ascending: false });
  const { data } = await query.limit(BOARD_COLUMN_LIMIT);
  return { key, total, leads: (data ?? []) as GrowthLead[] };
}

/** One column per follow-up stage, most urgent first. */
export async function loadBoard(db: GrowthDb, zone: { municipio?: string; giro?: string }): Promise<ServiceResult<LeadBoard>> {
  const counts = await pipelineCounts(db, zone);
  if (!counts.ok) return counts;
  const columns = await Promise.all(BOARD_COLUMNS.map((key) => boardColumn(db, key, zone, counts.data[key])));
  return { ok: true, data: { columns, counts: counts.data } };
}
