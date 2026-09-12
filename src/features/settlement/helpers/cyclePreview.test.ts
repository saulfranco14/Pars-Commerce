import { describe, it, expect } from "vitest";
import {
  previewCycles,
  commissionPercentForCycle,
} from "@/features/settlement/helpers/cyclePreview";

/**
 * S4 — the cycle preview a business sees before choosing. Confirms the numbers
 * shown match S2 and that "less frequent = keeps more" holds in the preview.
 */
describe("previewCycles (S4)", () => {
  it("previews every cycle; custom is null without an override", () => {
    const rows = previewCycles(1000);
    const byCycle = Object.fromEntries(rows.map((r) => [r.cycle, r]));

    expect(byCycle.daily.amountToTransfer).toBe(965); // 1000 - 3.5%
    expect(byCycle.monthly.amountToTransfer).toBe(980); // 1000 - 2%
    // less frequent keeps more
    expect(byCycle.monthly.amountToTransfer!).toBeGreaterThan(
      byCycle.daily.amountToTransfer!,
    );
    // custom without override → unknown
    expect(byCycle.custom.commissionPercent).toBeNull();
    expect(byCycle.custom.amountToTransfer).toBeNull();
  });

  it("shows custom with a contract override", () => {
    const rows = previewCycles(1000, 0.015);
    const custom = rows.find((r) => r.cycle === "custom")!;
    expect(custom.commissionPercent).toBe(0.015);
    expect(custom.amountToTransfer).toBe(985);
  });
});

describe("commissionPercentForCycle", () => {
  it("returns the tier percent, or the override, or null for custom", () => {
    expect(commissionPercentForCycle("weekly")).toBe(0.03);
    expect(commissionPercentForCycle("weekly", 0.01)).toBe(0.01);
    expect(commissionPercentForCycle("custom")).toBeNull();
    expect(commissionPercentForCycle("custom", 0.02)).toBe(0.02);
  });
});
