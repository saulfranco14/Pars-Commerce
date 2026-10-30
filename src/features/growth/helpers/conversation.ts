import type { ConversationFilter, ConversationItem } from "@/features/growth/interfaces/conversation";
import type { LeadEvent } from "@/features/growth/interfaces/lead";

const STORE_EVENTS = new Set(["para_viewed", "para_left", "para_seconds", "claim_clicked", "help_clicked", "objection_chosen", "visit_requested"]);
const MESSAGE_EVENTS = new Set(["whatsapp_sent", "email_sent", "whatsapp_replied", "email_replied", "whatsapp_no_answer", "email_no_answer", "no_whatsapp", "wrong_number", "email_bounced"]);

/** Turns the event log into a conversation: what we sent, what they answered, and what happened around it. */
export function conversationItems(events: LeadEvent[], filter: ConversationFilter = "todo"): ConversationItem[] {
  return [...events]
    .sort((a, b) => a.created_at.localeCompare(b.created_at))
    .map((event): ConversationItem => {
      const body = typeof event.payload.body === "string" ? event.payload.body : null;
      const reply = typeof event.payload.text === "string" ? event.payload.text : null;
      const note = typeof event.payload.note === "string" ? event.payload.note : null;
      if (event.type === "whatsapp_sent" || event.type === "email_sent") return { event, kind: "out", filter: "mensajes", text: body };
      if (event.type === "whatsapp_replied" || event.type === "email_replied") return { event, kind: "in", filter: "mensajes", text: reply };
      if (STORE_EVENTS.has(event.type)) return { event, kind: "event", filter: "tienda", text: null };
      if (MESSAGE_EVENTS.has(event.type)) return { event, kind: "event", filter: "mensajes", text: null };
      return { event, kind: "event", filter: "notas", text: note };
    })
    .filter((item) => filter === "todo" || item.filter === filter);
}
