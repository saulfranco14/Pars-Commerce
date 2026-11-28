import { describe, expect, it } from "vitest";

import { commercialDates, datesOn, upcomingDate } from "@/features/ventas/helpers/commercialCalendar";
import { buildWeekReport } from "@/features/ventas/helpers/weekReport";

const CONTEXT = { giroLabel: "Renta de carpas", place: "Chimalhuacán, Estado de México" };

describe("commercialCalendar", () => {
  it("moves the long weekends to their Monday", () => {
    const dates = commercialDates(2026);
    expect(dates.find((entry) => entry.label === "Puente de la Revolución")?.date).toBe("2026-11-16");
    expect(dates.find((entry) => entry.label === "Puente del Día de la Constitución")?.date).toBe("2026-02-02");
    expect(dates.find((entry) => entry.label === "Viernes Santo")?.date).toBe("2026-04-03");
  });

  it("names what a day had", () => {
    expect(datesOn("2026-11-02")).toEqual(["Día de Muertos"]);
    expect(datesOn("2026-11-30")).toEqual(["Quincena"]);
    expect(datesOn("2026-11-04")).toEqual([]);
  });

  it("finds the posadas as one stretch and skips paydays", () => {
    expect(upcomingDate("2026-11-28")).toEqual({ label: "Día de la Virgen de Guadalupe", start: "2026-12-12", end: "2026-12-12", inDays: 14 });
    expect(upcomingDate("2026-12-13")).toEqual({ label: "Posadas", start: "2026-12-16", end: "2026-12-24", inDays: 3 });
    expect(upcomingDate("2026-12-30")?.label).toBe("Fin de año");
  });
});

describe("buildWeekReport", () => {
  // The tent-rental example: Monday 2 and Tuesday 3 of November fell against the week before.
  const totals: Record<string, number> = {
    "2026-10-26": 900, "2026-10-27": 600, "2026-10-28": 700, "2026-10-29": 1200, "2026-10-30": 2400, "2026-10-31": 3800, "2026-11-01": 2600,
    "2026-11-02": 300, "2026-11-03": 200, "2026-11-04": 800, "2026-11-05": 1100, "2026-11-06": 2300, "2026-11-07": 3500, "2026-11-08": 2900,
  };

  it("compares the last 7 days with the 7 before", () => {
    const report = buildWeekReport(totals, "2026-11-08", CONTEXT);
    expect(report.days).toHaveLength(14);
    expect(report.total).toBe(11_100);
    expect(report.previousTotal).toBe(12_200);
    expect(report.change).toBe(-9);
  });

  it("marks the low days with what the calendar had, never today", () => {
    const report = buildWeekReport(totals, "2026-11-08", CONTEXT);
    expect(report.lowDays.map((day) => [day.date, day.coincides])).toEqual([
      ["2026-11-02", ["Día de Muertos"]],
      ["2026-11-03", []],
    ]);
    expect(buildWeekReport({ ...totals, "2026-11-08": 0 }, "2026-11-08", CONTEXT).lowDays.map((day) => day.date)).not.toContain("2026-11-08");
  });

  it("has no change to show without last week's sales", () => {
    expect(buildWeekReport({ "2026-11-08": 500 }, "2026-11-08", CONTEXT).change).toBeNull();
  });
});
