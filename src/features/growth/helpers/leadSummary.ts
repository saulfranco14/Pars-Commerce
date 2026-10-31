import type { LeadEvent, LeadSummary } from "@/features/growth/interfaces/lead";

const SENT = new Set(["whatsapp_sent", "email_sent"]);
const REPLIED = new Set(["whatsapp_replied", "email_replied"]);

const text = (value: unknown): string | null => (typeof value === "string" && value.trim() ? value : null);

/** Everything worth knowing about a prospect at a glance, read from its events (any order). */
export function buildLeadSummary(events: LeadEvent[]): LeadSummary {
  const ordered = [...events].sort((a, b) => b.created_at.localeCompare(a.created_at));
  const sent = ordered.filter((event) => SENT.has(event.type));
  const views = ordered.filter((event) => event.type === "para_viewed");
  const seconds = ordered.flatMap((event) => (event.type === "para_left" && typeof event.payload.seconds === "number" ? [event.payload.seconds] : []));
  const objection = ordered.find((event) => event.type === "objection_chosen");
  const visit = ordered.find((event) => event.type === "visit_requested");
  const reply = ordered.find((event) => REPLIED.has(event.type));
  const replyText = ordered.find((event) => REPLIED.has(event.type) && text(event.payload.text));

  return {
    sent: sent.length,
    lastSentAt: sent[0]?.created_at ?? null,
    views: views.length,
    lastViewAt: views[0]?.created_at ?? null,
    averageSeconds: seconds.length ? Math.round(seconds.reduce((sum, value) => sum + value, 0) / seconds.length) : null,
    objection: objection ? text(objection.payload.reason) : null,
    visitRequest: visit ? { day: text(visit.payload.day), slot: text(visit.payload.slot) } : null,
    claimClicked: ordered.some((event) => event.type === "claim_clicked"),
    repliedAt: reply?.created_at ?? null,
    lastReply: replyText ? text(replyText.payload.text) : null,
  };
}
