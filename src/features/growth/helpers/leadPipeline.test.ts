import { describe, expect, it } from "vitest";

import { calendarDaysBetween, canFollowUp, daysFromToday, nextStepDue, pipelineIndex, sortByUrgency } from "@/features/growth/helpers/leadPipeline";

// 2026-10-28 12:00 in Mexico City.
const now = new Date("2026-10-28T18:00:00Z");
const base = { stage: "contactado", next_step: "whatsapp", whatsapp_attempts: 1, appointment_at: null } as const;

describe("pipeline position", () => {
  it("orders the six steps and leaves side exits out", () => {
    expect(pipelineIndex("nuevo")).toBe(0);
    expect(pipelineIndex("conversando")).toBe(3);
    expect(pipelineIndex("registrado")).toBe(5);
    expect(pipelineIndex("descartado")).toBe(-1);
  });
});

describe("nextStepDue", () => {
  it("is empty without a next step", () => {
    expect(nextStepDue({ ...base, next_step_at: null }, now)).toBeNull();
  });

  it("counts calendar days in Mexico City", () => {
    // 23:30 tonight in Mexico City is still today, although it is tomorrow in UTC.
    expect(nextStepDue({ ...base, next_step_at: "2026-10-29T05:30:00Z" }, now)).toEqual({ label: "Mandar seguimiento", when: "hoy", tone: "warning" });
    expect(nextStepDue({ ...base, next_step_at: "2026-10-31T16:00:00Z" }, now)?.when).toBe("en 3 días");
    expect(calendarDaysBetween(now, new Date("2026-10-29T06:30:00Z"))).toBe(1);
  });

  it("turns red once it is late", () => {
    expect(nextStepDue({ ...base, next_step_at: "2026-10-26T16:00:00Z" }, now)).toEqual({ label: "Mandar seguimiento", when: "venció hace 2 días", tone: "danger" });
  });

  it("names the step after the stage", () => {
    expect(nextStepDue({ ...base, stage: "caliente", next_step_at: now.toISOString() }, now)?.label).toBe("Escríbele: vio su tienda");
    expect(nextStepDue({ ...base, stage: "conversando", next_step: "retomar", next_step_at: "2026-11-05T16:00:00Z" }, now)?.label).toBe("Retomar");
    const visit = nextStepDue({ ...base, stage: "cita", next_step: "visita", next_step_at: "2026-10-30T17:00:00Z", appointment_at: "2026-10-30T17:00:00Z" }, now);
    expect(visit?.label).toBe("Visita");
    expect(visit?.when).toMatch(/30/);
  });
});

describe("canFollowUp", () => {
  it("only offers moves the pipeline allows", () => {
    expect(canFollowUp({ stage: "conversando", snoozed_until: null }, "schedule_visit")).toBe(true);
    expect(canFollowUp({ stage: "cita", snoozed_until: null }, "schedule_visit")).toBe(false);
    expect(canFollowUp({ stage: "conversando", snoozed_until: null }, "cancel_visit")).toBe(false);
    expect(canFollowUp({ stage: "descartado", snoozed_until: null }, "remind")).toBe(false);
    expect(canFollowUp({ stage: "conversando", snoozed_until: null }, "replied")).toBe(false);
    expect(canFollowUp({ stage: "conversando", snoozed_until: "2026-11-05T16:00:00Z" }, "resume", now)).toBe(true);
  });
});

describe("daysFromToday", () => {
  it("lands on the given hour in Mexico City", () => {
    expect(daysFromToday(1, 10, now)).toBe("2026-10-29T16:00:00.000Z");
  });
});

describe("urgency order", () => {
  it("puts overdue first, then today, then later and undated, keeping ties in place", () => {
    const later = { ...base, id: "later", next_step_at: "2026-10-31T16:00:00Z" };
    const none = { ...base, id: "none", next_step_at: null };
    const today = { ...base, id: "today", next_step_at: "2026-10-29T05:30:00Z" };
    const overdue = { ...base, id: "overdue", next_step_at: "2026-10-26T16:00:00Z" };
    const later2 = { ...base, id: "later2", next_step_at: "2026-11-02T16:00:00Z" };
    expect(sortByUrgency([none, later, today, overdue, later2], now).map((lead) => lead.id)).toEqual(["overdue", "today", "later", "later2", "none"]);
  });
});
