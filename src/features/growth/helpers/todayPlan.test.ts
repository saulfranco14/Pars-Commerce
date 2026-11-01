import { describe, expect, it } from "vitest";

import { buildTodayPlan, mexicoClock, nextWriteTime } from "@/features/growth/helpers/todayPlan";

import type { TodayFacts } from "@/features/growth/interfaces/tlacoAi";

// Mexico City is UTC-6 all year.
const at = (iso: string) => new Date(`${iso}-06:00`);

const FACTS: TodayFacts = { dueToday: 24, overdue: 21, replied: 1, hot: 3, cold: 12, sentToday: 0, dailyGoal: 20, visitsToday: 0, repliedName: "Cafetería al Sabor del Chef" };

describe("mexicoClock", () => {
  it("reads weekday and hour in Mexico City", () => {
    expect(mexicoClock(at("2026-11-01T11:30:00"))).toEqual({ weekday: 0, hour: 11.5 });
    expect(mexicoClock(at("2026-11-02T22:00:00"))).toEqual({ weekday: 1, hour: 22 });
  });
});

describe("nextWriteTime", () => {
  it("skips Sunday and Saturday afternoon to Monday", () => {
    expect(nextWriteTime(0, 11)).toBe("mañana a las 10");
    expect(nextWriteTime(6, 17)).toBe("el lunes a las 10");
  });

  it("stays in the same day when a window is still ahead", () => {
    expect(nextWriteTime(2, 14)).toBe("a las 4 de la tarde");
    expect(nextWriteTime(2, 8)).toBe("a las 10");
  });

  it("moves Friday night to Saturday morning", () => {
    expect(nextWriteTime(5, 22)).toBe("mañana a las 10");
  });
});

describe("buildTodayPlan", () => {
  it("on Sunday only answers and cleans now; writing waits for Monday", () => {
    const plan = buildTodayPlan(FACTS, at("2026-11-01T11:00:00"));
    expect(plan.intro).toMatch(/domingo/);
    const now = plan.steps.filter((step) => step.when === null).map((step) => step.action);
    expect(now).toEqual(["replied", "cold"]);
    expect(plan.steps.find((step) => step.action === "first")?.when).toBe("mañana a las 10");
    expect(plan.text).toContain("Contesta a Cafetería al Sabor del Chef.");
  });

  it("on a weekday morning everything is for now", () => {
    const plan = buildTodayPlan(FACTS, at("2026-11-02T10:30:00"));
    expect(plan.steps.every((step) => step.when === null)).toBe(true);
    expect(plan.steps.map((step) => step.action)).toEqual(["replied", "hot", "follow_up", "cold", "first"]);
    expect(plan.steps.find((step) => step.action === "follow_up")?.title).toBe("Manda los 20 seguimientos que te tocan");
  });

  it("late at night leaves answering for tomorrow", () => {
    const plan = buildTodayPlan(FACTS, at("2026-11-03T22:00:00"));
    expect(plan.intro).toMatch(/tarde/);
    expect(plan.steps.find((step) => step.action === "replied")?.when).toBe("mañana temprano");
  });

  it("keeps the same signature for small changes and a new one for real ones", () => {
    const base = buildTodayPlan(FACTS, at("2026-11-02T10:30:00"));
    expect(buildTodayPlan({ ...FACTS, overdue: 22 }, at("2026-11-02T10:45:00")).signature).toBe(base.signature);
    expect(buildTodayPlan({ ...FACTS, replied: 2, repliedName: null }, at("2026-11-02T10:45:00")).signature).not.toBe(base.signature);
  });

  it("says so when there is nothing to do", () => {
    const plan = buildTodayPlan({ ...FACTS, dueToday: 0, overdue: 0, replied: 0, hot: 0, cold: 0, sentToday: 20 }, at("2026-11-02T10:30:00"));
    expect(plan.steps).toEqual([]);
    expect(plan.text).toContain("No tienes pendientes");
  });
});
