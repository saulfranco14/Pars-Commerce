import { describe, expect, it } from "vitest";

import { addInterval, formatInterval, periodBounds, renewalIssueDate } from "@/lib/offers/planPeriods";

describe("addInterval", () => {
  it("clamps month ends like Postgres", () => {
    expect(addInterval(new Date("2026-01-31T15:00:00Z"), { unit: "month", count: 1 }).toISOString()).toBe(
      "2026-02-28T15:00:00.000Z",
    );
    expect(addInterval(new Date("2028-01-31T15:00:00Z"), { unit: "month", count: 1 }).toISOString()).toBe(
      "2028-02-29T15:00:00.000Z",
    );
  });

  it("crosses the year boundary", () => {
    expect(addInterval(new Date("2026-11-15T00:00:00Z"), { unit: "month", count: 3 }).toISOString()).toBe(
      "2027-02-15T00:00:00.000Z",
    );
  });

  it("adds whole weeks", () => {
    expect(addInterval(new Date("2026-10-20T10:00:00Z"), { unit: "week", count: 2 }).toISOString()).toBe(
      "2026-11-03T10:00:00.000Z",
    );
  });
});

describe("periodBounds", () => {
  it("returns consecutive, non-overlapping periods", () => {
    const anchor = new Date("2026-10-20T12:00:00Z");
    const first = periodBounds(anchor, { unit: "month", count: 1 }, 1);
    const second = periodBounds(anchor, { unit: "month", count: 1 }, 2);
    expect(first.end.toISOString()).toBe(second.start.toISOString());
    expect(second.end.toISOString()).toBe("2026-12-20T12:00:00.000Z");
  });
});

describe("renewalIssueDate", () => {
  it("issues the next order lead days before the period ends", () => {
    expect(renewalIssueDate(new Date("2026-11-20T12:00:00Z"), 3).toISOString()).toBe("2026-11-17T12:00:00.000Z");
  });
});

describe("formatInterval", () => {
  it("reads naturally in Spanish", () => {
    expect(formatInterval({ unit: "month", count: 1 })).toBe("mes");
    expect(formatInterval({ unit: "week", count: 2 })).toBe("2 semanas");
  });
});
