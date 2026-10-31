import { formatDayTime } from "@/features/growth/helpers/leadPipeline";
import { visitDayLong } from "@/features/growth/helpers/paraVisit";
import { PARA_OBJECTION_LABEL, PARA_VISIT_SLOT_LABEL } from "@/features/growth/constants/para";

import type { ParaObjection, ParaVisitSlot } from "@/features/growth/interfaces/para";
import type { NextAction, WhatsappSuggestion } from "@/features/growth/interfaces/whatsapp";

/** "hace 2 h", "ayer", "hace 3 días": how long ago something happened, in plain words. */
export function timeAgo(iso: string, now: Date): string {
  const hours = Math.floor((now.getTime() - new Date(iso).getTime()) / 3_600_000);
  if (hours < 1) return "hace un momento";
  if (hours < 24) return `hace ${hours} h`;
  const days = Math.floor(hours / 24);
  return days === 1 ? "ayer" : `hace ${days} días`;
}

function times(count: number): string {
  return count === 1 ? "1 vez" : `${count} veces`;
}

function reasonFor(action: NextAction, now: Date): string {
  const { facts, wait } = action;
  switch (action.code) {
    case "registered":
      return "Ya se registró. Ayúdale a dejar lista su tienda y a cobrar.";
    case "activation":
      switch (facts.activation) {
        case "tienda_lista":
          return "Su tienda ya está lista; falta conectar Mercado Pago para que cobre.";
        case "cobros":
          return "Ya puede cobrar y todavía no vende. Ayúdale a compartir su enlace.";
        case "primera_venta":
          return wait ? "Ya vendió y ya le ayudaste a compartir su enlace. Revisa en unos días." : "Ya vendió una vez. Ayúdale a llegar a 5 pedidos al mes.";
        case "activo":
          return "Ya vende seguido. No hace falta escribirle.";
        default:
          return "Se registró pero no ha terminado su tienda. Ofrécele ayuda.";
      }
    case "dropped":
      return "Está dado de baja: no se le vuelve a escribir.";
    case "no_phone":
      return facts.views
        ? `Abrió su tienda ${times(facts.views)}, pero no tenemos su teléfono: síguelo por correo o visítalo. Si consigues su número, usa «Corregir teléfono».`
        : "No tenemos su teléfono: síguelo por correo o visítalo. Si consigues su número, usa «Corregir teléfono».";
    case "bad_phone":
      return "Ese número no sirve para WhatsApp. Si encontraste otro, usa «Corregir teléfono».";
    case "visit_passed":
      return wait
        ? "Ya le escribiste después de la visita. Espera su respuesta."
        : `La visita fue ${facts.appointment_at ? timeAgo(facts.appointment_at, now) : "hace poco"}: mándale su enlace y cómo seguir.`;
    case "visit_soon":
      if (!wait) return `Su visita es el ${facts.appointment_at ? formatDayTime(facts.appointment_at) : "día acordado"}: confírmasela.`;
      return facts.appointment_at && new Date(facts.appointment_at).getTime() - now.getTime() > 36 * 3_600_000
        ? `Visita el ${formatDayTime(facts.appointment_at)}. El recordatorio conviene un día antes.`
        : "Ya le confirmaste la visita.";
    case "visit_requested": {
      const day = facts.visit?.day ? visitDayLong(facts.visit.day) : "pronto";
      const slot = facts.visit?.slot ? ` ${PARA_VISIT_SLOT_LABEL[facts.visit.slot as ParaVisitSlot] ?? ""}` : "";
      return `Pidió que lo visites el ${day}${slot}. Confírmale.`;
    }
    case "objection": {
      const label = PARA_OBJECTION_LABEL[facts.objection?.reason as ParaObjection];
      return label ? `En su tienda marcó «${label}». Respóndele eso primero.` : "Marcó una duda en su tienda. Respóndele eso primero.";
    }
    case "replied":
      return wait
        ? "Ya le mandaste su enlace después de que respondió. Espera su respuesta o agenda la visita."
        : "Te respondió: contéstale y mándale su enlace.";
    case "first":
      return "Todavía no le escribes: va el primer mensaje.";
    case "viewed": {
      const last = facts.last_view_at ? `, la última ${timeAgo(facts.last_view_at, now)}` : "";
      return `Abrió su tienda ${times(facts.views_since_last_send)} desde tu último mensaje${last}. Escríbele hoy.`;
    }
    case "last_call":
      return wait
        ? `Ya le escribiste ${facts.attempts} veces sin respuesta. El último mensaje conviene a los 7 días; mientras, puedes visitarlo.`
        : `${facts.attempts} mensajes sin respuesta: manda el último, amable. Después se pausa 60 días.`;
    case "exhausted":
      return "Ya le mandaste el último mensaje. No le escribas más; si pasas por su zona, visítalo.";
    case "follow_up":
      return wait
        ? `Le escribiste ${facts.last_sent_at ? timeAgo(facts.last_sent_at, now) : "hace poco"}. El seguimiento conviene a los 3 días.`
        : `Le escribiste ${facts.last_sent_at ? timeAgo(facts.last_sent_at, now) : "hace días"} y no contestó: toca el seguimiento.`;
  }
}

/** Turns growth_lead_next_action into what the composer shows: the step and why, in plain Spanish. */
export function describeNextAction(action: NextAction, now: Date = new Date()): WhatsappSuggestion {
  return { step: action.step, wait: action.wait, reason: reasonFor(action, now) };
}
