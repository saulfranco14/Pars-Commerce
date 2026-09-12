import { describe, it, expect } from "vitest";
import {
  evaluateCycleDue,
  cycleDurationDays,
} from "@/features/settlement/helpers/cycleDue";

/**
 * S4 — the "is this cycle due?" logic. Pure, so the scheduler's timing is
 * deterministic and frozen. `now` is injected so tests don't depend on the
 * clock.
 */
const DAY = 24 * 60 * 60 * 1000;

describe("cycleDurationDays", () => {
  it("maps each cycle to its span", () => {
    expect(cycleDurationDays("daily")).toBe(1);
    expect(cycleDurationDays("weekly")).toBe(7);
    expect(cycleDurationDays("biweekly")).toBe(15);
    expect(cycleDurationDays("monthly")).toBe(30);
    expect(cycleDurationDays("custom", 10)).toBe(10);
    expect(cycleDurationDays("custom", null)).toBe(7); // fallback
  });
});

describe("evaluateCycleDue (S4 scheduler timing)", () => {
  const now = new Date("2026-07-18T12:00:00Z");

  it("is always due on first run (never settled)", () => {
    const r = evaluateCycleDue("weekly", null, now);
    expect(r.due).toBe(true);
    expect(r.periodEnd).toBe(now.toISOString());
    expect(new Date(r.periodStart).getTime()).toBe(0); // epoch start
  });

  it("is due once a full cycle has elapsed since last settle", () => {
    const eightDaysAgo = new Date(now.getTime() - 8 * DAY).toISOString();
    const r = evaluateCycleDue("weekly", eightDaysAgo, now); // 7-day cycle
    expect(r.due).toBe(true);
    expect(r.periodStart).toBe(eightDaysAgo);
    expect(r.periodEnd).toBe(now.toISOString());
  });

  it("is NOT due before a full cycle has elapsed", () => {
    const threeDaysAgo = new Date(now.getTime() - 3 * DAY).toISOString();
    const r = evaluateCycleDue("weekly", threeDaysAgo, now); // 7-day cycle
    expect(r.due).toBe(false);
  });

  it("respects a custom cycle length", () => {
    const fiveDaysAgo = new Date(now.getTime() - 5 * DAY).toISOString();
    // custom 3 days → 5 days elapsed → due
    expect(evaluateCycleDue("custom", fiveDaysAgo, now, 3).due).toBe(true);
    // custom 10 days → 5 days elapsed → not due
    expect(evaluateCycleDue("custom", fiveDaysAgo, now, 10).due).toBe(false);
  });
});
