import { describe, expect, it } from "vitest";
import { studioNextPeriodEnd } from "./billingPeriods";

describe("Studio provider billing calendar", () => {
  it("preserves the original billing day after a short month", () => {
    expect(
      studioNextPeriodEnd("2026-02-28T18:00:00Z", "2026-01-31T18:00:00Z"),
    ).toBe("2026-03-31T18:00:00.000Z");
    expect(studioNextPeriodEnd("2028-01-31T18:00:00Z")).toBe(
      "2028-02-29T18:00:00.000Z",
    );
  });
  it("uses the provider's next boundary for the corresponding current cycle", () => {
    expect(
      studioNextPeriodEnd(
        "2026-11-30T18:00:00Z",
        "2026-10-31T18:00:00Z",
        "2026-12-31T17:00:00Z",
      ),
    ).toBe("2026-12-31T17:00:00.000Z");
  });
  it("does not extend a historical payment to today's next renewal date", () => {
    expect(
      studioNextPeriodEnd(
        "2026-08-31T18:00:00Z",
        "2026-07-31T18:00:00Z",
        "2026-12-31T18:00:00Z",
      ),
    ).toBe("2026-09-30T18:00:00.000Z");
  });
});
