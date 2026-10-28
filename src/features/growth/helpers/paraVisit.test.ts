import { describe, expect, it } from "vitest";

import { parseObjection, parseVisitRequest, visitDayLong, visitDayOptions } from "@/features/growth/helpers/paraVisit";

const TZ = "America/Mexico_City";
// Wednesday 28 Oct 2026, 23:30 in Mexico City (05:30 UTC on Thursday the 29th).
const NOW = new Date("2026-10-29T05:30:00Z");

describe("visitDayOptions", () => {
  it("starts tomorrow in Mexico City and skips Sunday", () => {
    expect(visitDayOptions(NOW, TZ).map((day) => day.value)).toEqual(["2026-10-29", "2026-10-30", "2026-10-31", "2026-11-02", "2026-11-03", "2026-11-04"]);
  });

  it("labels days for a chip", () => {
    expect(visitDayOptions(NOW, TZ)[0].label).toBe("Jue 29");
  });

  it("spells a day out for the alert", () => {
    expect(visitDayLong("2026-10-30")).toBe("viernes 30 de octubre");
  });
});

describe("parseVisitRequest", () => {
  it("accepts an offered day and slot", () => {
    expect(parseVisitRequest({ day: "2026-10-30", slot: "tarde" }, NOW, TZ)).toEqual({ day: "2026-10-30", slot: "tarde" });
  });

  it("rejects past days, Sundays, far days and unknown slots", () => {
    expect(parseVisitRequest({ day: "2026-10-27", slot: "tarde" }, NOW, TZ)).toBeNull();
    expect(parseVisitRequest({ day: "2026-11-01", slot: "tarde" }, NOW, TZ)).toBeNull();
    expect(parseVisitRequest({ day: "2027-01-10", slot: "tarde" }, NOW, TZ)).toBeNull();
    expect(parseVisitRequest({ day: "2026-10-30", slot: "noche" }, NOW, TZ)).toBeNull();
    expect(parseVisitRequest("x", NOW, TZ)).toBeNull();
  });
});

describe("parseObjection", () => {
  it("keeps only known reasons", () => {
    expect(parseObjection({ reason: "costo" })).toBe("costo");
    expect(parseObjection({ reason: "toString" })).toBeNull();
    expect(parseObjection(null)).toBeNull();
  });
});
