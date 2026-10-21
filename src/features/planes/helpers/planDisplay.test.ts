import { describe, expect, it } from "vitest";

import { nextChargeDate, planEvery, planFacts, planSavings, weekdayPlural } from "@/features/planes/helpers/planDisplay";

describe("plan display", () => {
  it("names the interval and the savings against list price", () => {
    expect(planEvery({ interval_unit: "month", interval_count: 1 })).toBe("mes");
    expect(planEvery({ interval_unit: "week", interval_count: 2 })).toBe("2 semanas");
    expect(planSavings({ price: 559, list_value: 620 })).toBe(61);
    expect(planSavings({ price: 700, list_value: 620 })).toBe(0);
  });

  it("states only the real delivery facts", () => {
    expect(planFacts({ fulfillment_methods: ["pickup", "delivery"], preferred_weekday: 6, max_periods: null })).toEqual([
      "A domicilio o para recoger",
      "Entrega los sábados",
      "Cancela cuando quieras",
    ]);
    expect(planFacts({ fulfillment_methods: ["pickup"], preferred_weekday: null, max_periods: 6 })).toEqual(["Listo para recoger", "6 periodos"]);
  });

  it("pluralizes weekdays the Spanish way", () => {
    expect([0, 1, 3, 6].map(weekdayPlural)).toEqual(["los domingos", "los lunes", "los miércoles", "los sábados"]);
  });

  it("dates the next charge one interval after today, clamping month ends", () => {
    expect(nextChargeDate({ interval_unit: "month", interval_count: 1 }, new Date("2027-01-31T18:00:00Z")).toISOString()).toBe(
      "2027-02-28T18:00:00.000Z",
    );
  });
});
