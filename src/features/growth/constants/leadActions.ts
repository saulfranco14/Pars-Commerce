import { BellRing, CalendarClock, CalendarX, MessageCircle, MessageSquareReply, NotebookPen, PauseCircle, Pencil, PlayCircle, Store, UserPlus, UserRound, UserX } from "lucide-react";

import { STAGE_ACTION_HINT, STAGE_ACTION_LABEL } from "@/features/growth/constants/leadPipeline";

import type { LucideIcon } from "lucide-react";
import type { LeadSheetAction } from "@/features/growth/interfaces/leadActions";

export const LEAD_ACTION_ICON: Record<LeadSheetAction, LucideIcon> = {
  replied: MessageSquareReply,
  schedule_visit: CalendarClock,
  reschedule_visit: CalendarClock,
  cancel_visit: CalendarX,
  remind: BellRing,
  pause: PauseCircle,
  resume: PlayCircle,
  note: NotebookPen,
  register: UserPlus,
  not_interested: UserX,
  whatsapp: MessageCircle,
  phone: Pencil,
  giro: Store,
  owner: UserRound,
};

export const LEAD_ACTION_LABEL: Record<LeadSheetAction, string> = {
  ...STAGE_ACTION_LABEL,
  replied: "Ya respondió",
  whatsapp: "Escribirle por WhatsApp",
  phone: "Corregir teléfono",
  giro: "Corregir giro",
  owner: "Cambiar quién lo trabaja",
};

/** Short names for the two shortcuts under the main button, where space is tight. */
export const LEAD_ACTION_SHORT: Partial<Record<LeadSheetAction, string>> = {
  replied: "Respondió",
  register: "Dar de alta",
  remind: "Recordarme",
  reschedule_visit: "Cambiar cita",
  cancel_visit: "Cancelar cita",
};

export const LEAD_ACTION_HINT: Record<LeadSheetAction, string> = {
  ...STAGE_ACTION_HINT,
  replied: "Si te escribió algo, pégalo. Pasa a «Respondió» y te sugerimos qué contestarle.",
  whatsapp: "Abre el mensaje sugerido aquí mismo.",
  phone: "Si encontraste otro número, para que el WhatsApp salga bien.",
  giro: "Su «Para ti» muestra la tienda de ese giro.",
  owner: "Pásalo a otra persona del equipo.",
};
