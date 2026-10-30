import { TLACO_WORKSPACE_ID } from "@/features/growth/constants/workspace";
import { internalError } from "@/features/growth/services/growthDb";
import { SEND_HOUR_MAX, SEND_HOUR_MIN } from "@/features/growth/constants/sendWindow";

import type { GrowthDb } from "@/features/growth/services/growthDb";
import type { GrowthSettings, GrowthSettingsPatch } from "@/features/growth/interfaces/settings";
import type { ServiceResult } from "@/features/qr/services/tablePaymentService";

const COLUMNS = "paused, paused_reason, timezone, send_days, send_start_hour, send_end_hour, signature, visit_municipios, email_variant_weights, digest_hour, last_digest_on";

export async function getSettings(db: GrowthDb, workspaceId = TLACO_WORKSPACE_ID): Promise<GrowthSettings> {
  const { data, error } = await db.from("growth_settings").select(COLUMNS).eq("workspace_id", workspaceId).single();
  if (error || !data) throw new Error(error?.message ?? "growth_settings missing");
  return data as GrowthSettings;
}

export async function updateSettings(db: GrowthDb, workspaceId: string, patch: GrowthSettingsPatch): Promise<ServiceResult<GrowthSettings>> {
  const fields: Record<string, unknown> = { updated_at: new Date().toISOString() };
  if (patch.paused !== undefined) {
    fields.paused = patch.paused;
    fields.paused_reason = patch.paused ? patch.paused_reason?.slice(0, 200) || "Pausado a mano" : null;
  }
  if (patch.signature !== undefined) {
    const signature = patch.signature.trim();
    if (signature.length < 2 || signature.length > 60) return { ok: false, error: { code: "validation", message: "La firma debe tener entre 2 y 60 caracteres." } };
    fields.signature = signature;
  }
  if (patch.send_start_hour !== undefined || patch.send_end_hour !== undefined) {
    const start = patch.send_start_hour ?? 9;
    const end = patch.send_end_hour ?? 18;
    if (!Number.isInteger(start) || !Number.isInteger(end) || start < SEND_HOUR_MIN || end > SEND_HOUR_MAX || start >= end) {
      return { ok: false, error: { code: "validation", message: `El horario debe estar entre ${SEND_HOUR_MIN}:00 y ${SEND_HOUR_MAX}:00 y empezar antes de terminar.` } };
    }
    fields.send_start_hour = start;
    fields.send_end_hour = end;
  }
  if (patch.send_days !== undefined) {
    const days = [...new Set(patch.send_days)].filter((day) => Number.isInteger(day) && day >= 0 && day <= 6);
    if (!days.length) return { ok: false, error: { code: "validation", message: "Elige al menos un día de envío." } };
    fields.send_days = days.sort();
  }

  const { data, error } = await db.from("growth_settings").update(fields).eq("workspace_id", workspaceId).select(COLUMNS).single();
  if (error) return internalError(error.message);
  return { ok: true, data: data as GrowthSettings };
}
