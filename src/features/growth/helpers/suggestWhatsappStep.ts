import type { GrowthLead } from "@/features/growth/interfaces/lead";
import type { WhatsappStep, WhatsappSuggestion } from "@/features/growth/interfaces/whatsapp";

/** Same wait the Telegram /seguimientos batch uses (growth_reserve_batch). */
export const FOLLOW_UP_DAYS = 3;

type SuggestionLead = Pick<GrowthLead, "stage" | "phone_e164" | "phone_status" | "whatsapp_attempts" | "last_whatsapp_at">;

function daysSince(iso: string, now: Date): number {
  return Math.floor((now.getTime() - new Date(iso).getTime()) / 86_400_000);
}

/** Picks the WhatsApp message that fits where this prospect is in its timeline. */
export function suggestWhatsappStep(lead: SuggestionLead, now: Date = new Date()): WhatsappSuggestion {
  if (lead.stage === "registrado") return { step: null, reason: "Ya se registró en Tlaco.", wait: false };
  if (lead.stage === "descartado") return { step: null, reason: "Está dado de baja: no se le vuelve a escribir.", wait: false };
  if (!lead.phone_e164) return { step: null, reason: "No tiene teléfono.", wait: false };
  if (lead.phone_status === "sin_whatsapp" || lead.phone_status === "equivocado") {
    return { step: null, reason: "Ese número no sirve para WhatsApp. Si encontraste otro, usa «Corregir teléfono».", wait: false };
  }
  if (lead.phone_status === "respondio") return { step: "si", reason: "Te respondió: mándale su link para que active su tienda.", wait: false };
  if (lead.whatsapp_attempts === 0) return { step: "m1", reason: "Todavía no le escribes: va el primer mensaje.", wait: false };

  const days = lead.last_whatsapp_at ? daysSince(lead.last_whatsapp_at, now) : FOLLOW_UP_DAYS;
  if (lead.whatsapp_attempts >= 2) {
    return { step: "seguimiento", reason: "Ya le escribiste 2 veces sin respuesta. Mejor espera a que conteste o visítalo.", wait: true };
  }
  if (days < FOLLOW_UP_DAYS) {
    const ago = days === 0 ? "hoy" : `hace ${days} día${days === 1 ? "" : "s"}`;
    return { step: "seguimiento", reason: `Le escribiste ${ago}. El seguimiento conviene a los ${FOLLOW_UP_DAYS} días.`, wait: true };
  }
  return { step: "seguimiento", reason: `Le escribiste hace ${days} días y no contestó: toca el seguimiento.`, wait: false };
}

export const WHATSAPP_STEP_ORDER: WhatsappStep[] = ["m1", "seguimiento", "si"];
