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

/** «Cómo funciona»: what each step means, what to do there and what moves it forward. */
export const PIPELINE_GUIDE = [
  {
    label: "Por contactar",
    means: "Nadie le ha escrito todavía.",
    todo: "Mándale el primer mensaje desde el barrido de tu zona.",
    moves: "Pasa a «Contactado» cuando confirmas «Sí, enviado».",
  },
  {
    label: "Contactado",
    means: "Ya le escribiste y no ha contestado.",
    todo: "Espera 3 días. Si no responde, el seguimiento aparece solo en «Tu día».",
    moves: "Pasa solo a «Vio su tienda» si abre su enlace, o tú tocas «Marcar que respondió».",
  },
  {
    label: "Vio su tienda",
    means: "Abrió el enlace de su tienda de muestra.",
    todo: "Escríbele hoy: es cuando más interés tiene.",
    moves: "Toca «Marcar que respondió» cuando te conteste.",
  },
  {
    label: "Respondió",
    means: "Te contestó por WhatsApp o correo.",
    todo: "Resuelve su duda y ofrécele darlo de alta o visitarlo.",
    moves: "«Agendar cita» o «Dar de alta su negocio».",
  },
  {
    label: "Cita agendada",
    means: "Quedaron de verse un día y hora.",
    todo: "Visítalo; ese día aparece en «Tu día».",
    moves: "«Dar de alta su negocio» en la visita.",
  },
  {
    label: "Registrado",
    means: "Ya tiene su cuenta en Tlaco.",
    todo: "Ayúdale a dejar lista su tienda, conectar Mercado Pago y vender.",
    moves: "Lo sigues en la pestaña «Activación» hasta que vende seguido.",
  },
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
  replied: "Marcar que respondió",
  schedule_visit: "Agendar cita",
  reschedule_visit: "Cambiar la cita",
  cancel_visit: "Cancelar la cita",
  remind: "Recordármelo después",
  pause: "Pausar hasta…",
  resume: "Reactivar",
  note: "Agregar nota",
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

/** The tabs on Prospectos and what each one is for, shown under the tabs and in the guide. */
export const PROSPECT_VIEWS = [
  { value: "seguimiento", label: "Seguimiento", hint: "Los negocios a los que ya les escribiste, por etapa. Aquí trabajas el día a día." },
  { value: "activacion", label: "Activación", hint: "Los que ya se registraron: acompáñalos hasta que su tienda vende." },
  { value: "contactar", label: "Prospectar", hint: "La lista completa de tu zona para mandar primeros mensajes y buscar a alguien." },
  { value: "mapa", label: "Mapa", hint: "Dónde está cada negocio y qué tan avanzado va; sirve para armar una ruta de visitas." },
] as const;

/** «Cómo funciona» → the day, in the order «Tu día» shows it. */
export const DAY_GUIDE = [
  { title: "Contesta a quien respondió", detail: "Son los más cerca de registrarse. Abre su ficha, lee lo que dijo y usa el mensaje sugerido." },
  { title: "Escribe a quien le toca", detail: "Quien vio su tienda o lleva días sin contestar. La ficha te dice por qué y qué mandarle." },
  { title: "Manda primeros mensajes", detail: "El barrido te da uno por uno los negocios de tu zona hasta llegar a tu meta del día." },
];

/** «Cómo funciona» → the rules everyone on the team shares. */
export const TEAM_RULES = [
  "Quien le escribe primero a un negocio, o lo da de alta, se queda con él. Nadie más puede escribirle.",
  "Un teléfono o correo no se puede registrar dos veces: si ya existe, te decimos quién lo trabaja.",
  "Tlaco nunca manda WhatsApp solo: tú lo envías desde tu celular y al regresar confirmas «Sí, enviado».",
  "«No le interesa» lo da de baja en todos los canales y para todo el equipo.",
  "El coordinador puede reasignar negocios y ver el trabajo de todos.",
];
