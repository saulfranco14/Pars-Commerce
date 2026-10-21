import { describe, expect, it } from "vitest";

import { nextFreeSlug, slugifyPromotionName } from "@/features/promociones/helpers/promotionSlug";

describe("slugifyPromotionName", () => {
  it("keeps Spanish names readable in the URL", () => {
    expect(slugifyPromotionName("Café 2x1 ¡Hoy!")).toBe("cafe-2x1-hoy");
    expect(slugifyPromotionName("  Despensa   Básica  ")).toBe("despensa-basica");
  });
});

describe("nextFreeSlug", () => {
  it("adds a numeric suffix only when the slug is taken", () => {
    expect(nextFreeSlug("pack", [])).toBe("pack");
    expect(nextFreeSlug("pack", ["pack", "pack-2"])).toBe("pack-3");
  });

  it("falls back to a generic slug for names without letters", () => {
    expect(nextFreeSlug("", [])).toBe("promocion");
  });
});
