import { formatDayTime } from "@/features/growth/helpers/leadPipeline";
import { timeAgo } from "@/features/growth/helpers/nextActionReason";

import type { GrowthLead } from "@/features/growth/interfaces/lead";

type ReasonLead = Pick<GrowthLead, "stage" | "last_whatsapp_at" | "last_activity_at" | "appointment_at" | "para_viewed_at">;

/** Why this card is where it is, in a few words: «Abrió su tienda hace 2 h». */
export function boardCardReason(lead: ReasonLead, now: Date): string | null {
  const activity = lead.last_activity_at ? timeAgo(lead.last_activity_at, now) : null;
  switch (lead.stage) {
    case "contactado":
      return lead.last_whatsapp_at ? `Último mensaje ${timeAgo(lead.last_whatsapp_at, now)}` : null;
    case "caliente":
      return `Abrió su tienda ${timeAgo(lead.para_viewed_at ?? lead.last_activity_at ?? now.toISOString(), now)}`;
    case "conversando":
      return activity ? `Te respondió · última actividad ${activity}` : "Te respondió";
    case "cita":
      return lead.appointment_at ? `Visita el ${formatDayTime(lead.appointment_at)}` : null;
    case "registrado":
      return activity ? `Se registró ${activity}` : null;
    default:
      return null;
  }
}
