import { describe, expect, it } from "vitest";

import { describeNextAction, timeAgo } from "@/features/growth/helpers/nextActionReason";
import { pickVariant } from "@/features/growth/helpers/pickVariant";

import type { NextAction } from "@/features/growth/interfaces/whatsapp";

const NOW = new Date("2026-10-30T18:00:00Z");
const base: NextAction = { step: "m1", code: "first", wait: false, facts: { sent: [], attempts: 0, views: 0, views_since_last_send: 0 } };

describe("describeNextAction", () => {
  it("explains a store visit with how many times and how long ago", () => {
    const suggestion = describeNextAction(
      { ...base, step: "vio_tienda", code: "viewed", facts: { ...base.facts, attempts: 1, views: 3, views_since_last_send: 3, last_view_at: "2026-10-30T16:00:00Z" } },
      NOW,
    );
    expect(suggestion).toEqual({ step: "vio_tienda", wait: false, reason: "Abrió su tienda 3 veces desde tu último mensaje, la última hace 2 h. Escríbele hoy." });
  });

  it("names the doubt the owner picked in the store", () => {
    const suggestion = describeNextAction({ ...base, step: "objecion_costo", code: "objection", facts: { ...base.facts, objection: { reason: "costo", at: "2026-10-30T10:00:00Z" } } }, NOW);
    expect(suggestion.reason).toBe("En su tienda marcó «¿Cuánto me va a costar?». Respóndele eso primero.");
  });

  it("asks to wait when the follow-up is too soon", () => {
    const suggestion = describeNextAction({ ...base, step: "seguimiento", code: "follow_up", wait: true, facts: { ...base.facts, attempts: 1, last_sent_at: "2026-10-29T12:00:00Z" } }, NOW);
    expect(suggestion).toMatchObject({ wait: true, reason: "Le escribiste ayer. El seguimiento conviene a los 3 días." });
  });

  it("says how long ago in plain words", () => {
    expect(timeAgo("2026-10-30T17:30:00Z", NOW)).toBe("hace un momento");
    expect(timeAgo("2026-10-27T12:00:00Z", NOW)).toBe("hace 3 días");
  });
});

describe("pickVariant", () => {
  it("honors the operator's choice", () => {
    expect(pickVariant(["A", "B"], { requested: "B", sent: [], seed: "lead-1" })).toBe("B");
  });

  it("never repeats a variant the lead already received while another is left", () => {
    expect(pickVariant(["A", "B"], { sent: ["A"], seed: "lead-1" })).toBe("B");
    expect(pickVariant(["A", "B"], { sent: ["B"], seed: "lead-1" })).toBe("A");
  });

  it("is stable for the same lead", () => {
    const first = pickVariant(["A", "B", "C"], { sent: [], seed: "lead-42" });
    expect(pickVariant(["A", "B", "C"], { sent: [], seed: "lead-42" })).toBe(first);
  });

  it("returns null without templates", () => {
    expect(pickVariant([], { sent: [], seed: "x" })).toBeNull();
  });
});
