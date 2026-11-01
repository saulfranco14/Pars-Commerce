import { describe, expect, it } from "vitest";

import { openRate, pickVariant, VARIANT_MIN_SAMPLE, winningVariant } from "@/features/growth/helpers/pickVariant";

import type { VariantStats } from "@/features/growth/interfaces/template";

const stat = (variant: "A" | "B" | "C", sent: number, opened: number): VariantStats => ({ variant, sent, opened, replied: 0, claimed: 0 });
const leads = Array.from({ length: 400 }, (_, index) => `lead-${index}`);

describe("variant choice", () => {
  it("keeps the requested variant and never repeats one the lead already got", () => {
    expect(pickVariant(["A", "B", "C"], { requested: "C", sent: [], seed: "x" })).toBe("C");
    expect(pickVariant(["A", "B"], { sent: ["A"], seed: "x" })).toBe("B");
  });

  it("is stable for the same lead", () => {
    const stats = { A: stat("A", 40, 4), B: stat("B", 40, 12), C: stat("C", 40, 6) };
    expect(pickVariant(["A", "B", "C"], { sent: [], seed: "lead-7", stats })).toBe(pickVariant(["A", "B", "C"], { sent: [], seed: "lead-7", stats }));
  });

  it("sends only variants short of their sample until they have it", () => {
    const stats = { A: stat("A", 3, 1), B: stat("B", 56, 14), C: stat("C", 0, 0) };
    const picked = new Set(leads.map((seed) => pickVariant(["A", "B", "C"], { sent: [], seed, stats })));
    expect(picked).toEqual(new Set(["A", "C"]));
  });

  it("gives the best opener most leads and keeps testing the rest", () => {
    const stats = { A: stat("A", 40, 4), B: stat("B", 40, 12), C: stat("C", 40, 6) };
    expect(winningVariant(["A", "B", "C"], stats)).toBe("B");
    const counts = { A: 0, B: 0, C: 0 };
    for (const seed of leads) counts[pickVariant(["A", "B", "C"], { sent: [], seed, stats }) as "A" | "B" | "C"]++;
    expect(counts.B / leads.length).toBeGreaterThan(0.6);
    expect(counts.A).toBeGreaterThan(0);
    expect(counts.C).toBeGreaterThan(0);
  });

  it("does not crown a winner on a small sample", () => {
    expect(winningVariant(["A", "B"], { A: stat("A", VARIANT_MIN_SAMPLE - 1, 9), B: stat("B", 40, 4) })).toBeNull();
    expect(openRate(stat("A", 0, 0))).toBe(0.5);
  });
});
