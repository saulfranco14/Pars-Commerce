import type { LeadEvent } from "@/features/growth/interfaces/lead";

export type ConversationFilter = "todo" | "mensajes" | "tienda" | "notas";
export type ConversationKind = "out" | "in" | "event";

export interface ConversationItem {
  event: LeadEvent;
  kind: ConversationKind;
  filter: Exclude<ConversationFilter, "todo">;
  /** The words exchanged, when there are any. */
  text: string | null;
}
