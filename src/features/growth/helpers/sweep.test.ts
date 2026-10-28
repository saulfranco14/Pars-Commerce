import { describe, expect, it } from "vitest";

import { parseSweepFilters, sweepFiltersQuery } from "@/features/growth/helpers/sweepFilters";
import { mergeSweepQueue } from "@/features/growth/helpers/sweepQueue";

import type { SweepLead } from "@/features/growth/interfaces/sweep";

const lead = (id: string) => ({ id, business_name: id }) as SweepLead;

describe("sweep filters", () => {
  it("round-trips and defaults to the first message", () => {
    const filters = { kind: "seguimiento" as const, municipio: "Nezahualcóyotl", giro: "ferreteria" };
    expect(parseSweepFilters(new URLSearchParams(sweepFiltersQuery(filters)))).toEqual(filters);
    expect(parseSweepFilters(new URLSearchParams("tipo=otro"))).toEqual({ kind: "whatsapp", municipio: undefined, giro: undefined });
    expect(sweepFiltersQuery({ kind: "whatsapp" })).toBe("");
  });
});

describe("mergeSweepQueue", () => {
  it("keeps the card on screen first and appends new ones", () => {
    const merged = mergeSweepQueue([lead("a"), lead("b")], [lead("b"), lead("c"), lead("d")], new Set());
    expect(merged.map((item) => item.id)).toEqual(["a", "b", "c", "d"]);
  });

  it("never brings back a card that was just marked", () => {
    const merged = mergeSweepQueue([lead("b")], [lead("a"), lead("c")], new Set(["a"]));
    expect(merged.map((item) => item.id)).toEqual(["b", "c"]);
  });
});
