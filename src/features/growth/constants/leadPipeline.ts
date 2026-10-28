import type { BoardColumnKey, FollowUpAction, LeadStage } from "@/features/growth/interfaces/lead";

export type PipelineStepKey = "por_contactar" | BoardColumnKey;

/** The six steps a prospect walks to become a Tlaco store; each needs the one before. */
export const PIPELINE_STEPS: Array<{ key: PipelineStepKey; label: string; stages: LeadStage[] }> = [
  { key: "por_contactar", label: "Por contactar", stages: ["nuevo", "sin_contacto"] },
  { key: "contactado", label: "Contactado", stages: ["contactado"] },
  { key: "caliente", label: "Vio su tienda", stages: ["caliente"] },
  { key: "conversando", label: "Respondió", stages: ["conversando"] },
  { key: "cita", label: "Cita agendada", stages: ["cita"] },
  { key: "registrado", label: "Registrado", stages: ["registrado"] },
];

export const BOARD_COLUMNS: BoardColumnKey[] = ["contactado", "caliente", "conversando", "cita", "registrado"];
export const BOARD_COLUMN_LIMIT = 25;
/** The Registrado column only shows the latest wins. */
export const BOARD_REGISTERED_DAYS = 7;

export const OPEN_STAGES: LeadStage[] = ["nuevo", "sin_contacto", "contactado", "caliente", "conversando", "cita", "sin_respuesta"];

/** "replied" and "not_interested" reuse growth_record_outcome; the rest go through growth_follow_up. */
export type StageAction = FollowUpAction | "replied" | "not_interested";

export const STAGE_ACTIONS: Record<LeadStage, StageAction[]> = {
  nuevo: ["schedule_visit", "note"],
  sin_contacto: ["schedule_visit", "note"],
  contactado: ["replied", "remind", "schedule_visit", "note"],
  caliente: ["replied", "remind", "schedule_visit", "note"],
  conversando: ["schedule_visit", "remind", "pause", "note"],
  cita: ["reschedule_visit", "cancel_visit", "note"],
  sin_respuesta: ["replied", "schedule_visit", "note"],
  registrado: ["note"],
  descartado: ["note"],
};

export const STAGE_ACTION_LABEL: Record<StageAction, string> = {
  replied: "Respondió",
  schedule_visit: "Agendar cita",
  reschedule_visit: "Cambiar la cita",
  cancel_visit: "Cancelar la cita",
  remind: "Recordarme",
  pause: "Pausar hasta…",
  resume: "Reactivar",
  note: "Nota",
  not_interested: "No le interesa",
};

/** Presets for "Recordarme" and "Pausar hasta…", in days from today. */
export const REMIND_PRESETS = [
  { days: 1, label: "Mañana" },
  { days: 3, label: "En 3 días" },
  { days: 7, label: "En una semana" },
];

export const PAUSE_PRESETS = [
  { days: 7, label: "Una semana" },
  { days: 15, label: "15 días" },
  { days: 30, label: "Un mes" },
];
