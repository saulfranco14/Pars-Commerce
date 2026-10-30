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

/** One line under each board column: what to do with the prospects in it. */
export const BOARD_COLUMN_HINT: Record<BoardColumnKey, string> = {
  contactado: "Ya le escribiste. Si no contesta en 3 días, toca seguimiento.",
  caliente: "Abrió su tienda. Es el mejor momento para escribirle.",
  conversando: "Te contestó. Resuelve su duda y ofrece alta o visita.",
  cita: "Visitas agendadas. El día de la cita aparece en «Tu día».",
  registrado: "Ya tiene cuenta. Acompáñalo hasta que venda.",
};

/** «Cómo funciona»: the six steps and what the person does at each one. */
export const PIPELINE_GUIDE = [
  { label: "Por contactar", todo: "Mándale el primer mensaje desde el barrido de tu zona." },
  { label: "Contactado", todo: "Espera 3 días. Si no responde, el seguimiento aparece solo en «Tu día»." },
  { label: "Vio su tienda", todo: "Abrió su enlace: escríbele hoy, está interesado." },
  { label: "Respondió", todo: "Contesta su duda y ofrécele darlo de alta o visitarlo." },
  { label: "Cita agendada", todo: "Visítalo el día acordado; te lo recordamos ese día." },
  { label: "Registrado", todo: "Ayúdale a dejar lista su tienda, conectar cobros y vender." },
];
export const BOARD_COLUMN_LIMIT = 25;
/** The Registrado column only shows the latest wins. */
export const BOARD_REGISTERED_DAYS = 7;

export const OPEN_STAGES: LeadStage[] = ["nuevo", "sin_contacto", "contactado", "caliente", "conversando", "cita", "sin_respuesta"];

/** "replied" and "not_interested" reuse growth_record_outcome, "register" opens the registration; the rest go through growth_follow_up. */
export type StageAction = FollowUpAction | "replied" | "not_interested" | "register";

export const STAGE_ACTIONS: Record<LeadStage, StageAction[]> = {
  nuevo: ["schedule_visit", "note"],
  sin_contacto: ["schedule_visit", "note"],
  contactado: ["replied", "remind", "schedule_visit", "note"],
  caliente: ["replied", "register", "remind", "schedule_visit", "note"],
  conversando: ["schedule_visit", "register", "remind", "pause", "note"],
  cita: ["register", "reschedule_visit", "cancel_visit", "note"],
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
  register: "Dar de alta su negocio",
};

/** What each button does, said under it so nobody has to guess. */
export const STAGE_ACTION_HINT: Record<StageAction, string> = {
  replied: "Pasa a «Respondió» y te sugerimos qué contestarle.",
  schedule_visit: "Eliges día y hora. Ese día aparece en tu lista.",
  reschedule_visit: "Mueve la visita a otro día.",
  cancel_visit: "Regresa a «Respondió».",
  remind: "Vuelve a tu lista en 1, 3 o 7 días.",
  pause: "Nadie le escribe y sale de tu lista hasta esa fecha.",
  resume: "Vuelve a tu lista hoy.",
  note: "Algo que debas recordar de este negocio.",
  not_interested: "Baja en WhatsApp, correo y visitas. No se le vuelve a escribir.",
  register: "Le llega su acceso por correo, o lo registras en su celular.",
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
