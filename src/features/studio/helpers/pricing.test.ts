import { describe, expect, it } from "vitest";
import {
  STUDIO_PREVIEW_PACKS,
  STUDIO_PREVIEW_PLANS,
} from "../constants/marketing";
import { STUDIO_MIN_MARGIN_MXN, studioImageMargin } from "./pricing";

const catalog = [
  ...STUDIO_PREVIEW_PLANS.map((p) => ({
    name: p.name,
    price: p.amount_mxn,
    tlacos: p.monthly_tlacos,
  })),
  ...STUDIO_PREVIEW_PACKS.map((p) => ({
    name: p.name,
    price: p.amount_mxn,
    tlacos: p.tlacos,
  })),
];

describe("Studio pricing", () => {
  it("leaves at least one peso per image in every plan and pack, normal or Premium", () => {
    for (const item of catalog)
      for (const quality of ["economy", "premium"] as const)
        expect(
          studioImageMargin(item.price, item.tlacos, quality),
          `${item.name} · ${quality}`,
        ).toBeGreaterThanOrEqual(STUDIO_MIN_MARGIN_MXN);
  });
  it("matches the catalog applied in the database", () => {
    expect(catalog.map((c) => c.tlacos)).toEqual([40, 85, 160, 20, 55, 125]);
  });
});
