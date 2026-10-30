import { describe, expect, it } from "vitest";

import { conversationItems } from "@/features/growth/helpers/conversation";
import { buildLeadSummary } from "@/features/growth/helpers/leadSummary";

import type { LeadEvent } from "@/features/growth/interfaces/lead";

function event(type: string, created_at: string, payload: Record<string, unknown> = {}): LeadEvent {
  return { id: `${type}-${created_at}`, lead_id: "lead", type, channel: null, actor: "operator", actor_user_id: null, template_id: null, payload, created_at };
}

const EVENTS: LeadEvent[] = [
  event("whatsapp_sent", "2026-10-25T17:20:00Z", { body: "Buenas tardes, ¿hablo con la cafetería?" }),
  event("para_viewed", "2026-10-28T19:42:00Z"),
  event("para_left", "2026-10-28T19:44:10Z", { seconds: 130 }),
  event("objection_chosen", "2026-10-28T19:43:00Z", { reason: "costo" }),
  event("whatsapp_replied", "2026-10-28T20:01:00Z", { text: "¿Cuánto cuesta?" }),
  event("note_added", "2026-10-29T10:00:00Z", { note: "Pasar en la tarde" }),
  event("para_viewed", "2026-10-30T14:51:00Z"),
  event("para_left", "2026-10-30T14:52:05Z", { seconds: 65 }),
];

describe("buildLeadSummary", () => {
  it("adds up messages, store visits, doubts and the last reply", () => {
    expect(buildLeadSummary(EVENTS)).toEqual({
      sent: 1,
      lastSentAt: "2026-10-25T17:20:00Z",
      views: 2,
      lastViewAt: "2026-10-30T14:51:00Z",
      averageSeconds: 98,
      objection: "costo",
      visitRequest: null,
      claimClicked: false,
      repliedAt: "2026-10-28T20:01:00Z",
      lastReply: "¿Cuánto cuesta?",
    });
  });

  it("is empty for a prospect nobody has touched", () => {
    expect(buildLeadSummary([])).toMatchObject({ sent: 0, views: 0, averageSeconds: null, repliedAt: null });
  });
});

describe("conversationItems", () => {
  it("reads oldest first with both sides of the chat", () => {
    const items = conversationItems(EVENTS);
    expect(items[0]).toMatchObject({ kind: "out", text: "Buenas tardes, ¿hablo con la cafetería?" });
    expect(items.find((item) => item.kind === "in")?.text).toBe("¿Cuánto cuesta?");
  });

  it("filters by what the operator wants to see", () => {
    expect(conversationItems(EVENTS, "mensajes").map((item) => item.event.type)).toEqual(["whatsapp_sent", "whatsapp_replied"]);
    expect(conversationItems(EVENTS, "tienda")).toHaveLength(5);
    expect(conversationItems(EVENTS, "notas").map((item) => item.text)).toEqual(["Pasar en la tarde"]);
  });
});
