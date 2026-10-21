import { describe, expect, it } from "vitest";

import { collageImages, promotionCollageLabel } from "@/features/promociones/helpers/promotionVisual";

describe("promotion collage", () => {
  it("labels each kind of deal", () => {
    expect(promotionCollageLabel({ type: "bundle_price", value: 199 })).toEqual({ kicker: "Combo", label: expect.stringContaining("199") });
    expect(promotionCollageLabel({ type: "percentage", value: 30 }).kicker).toBe("Descuento");
    expect(promotionCollageLabel({ type: "nxm", value: 0, buy_quantity: 2, pay_quantity: 1 }).label).toContain("2x1");
  });

  it("takes up to three distinct photos and skips products without one", () => {
    const photos: Record<string, string | null> = { a: "1.jpg", b: null, c: "1.jpg", d: "2.jpg", e: "3.jpg", f: "4.jpg" };
    expect(collageImages(["a", "b", "c", "d", "e", "f"], (id) => photos[id])).toEqual(["1.jpg", "2.jpg", "3.jpg"]);
    expect(collageImages([], () => "x")).toEqual([]);
  });
});
