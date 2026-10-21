import { describe, expect, it } from "vitest";

import {
  allocatePackPrice,
  applyUnitPromotion,
  bestUnitPromotion,
  isPromotionLive,
  nxmUnitPrice,
  packSavings,
} from "@/lib/offers/pricing";

const NOW = new Date("2026-10-21T12:00:00Z");

function charged(lines: { key: string; quantity: number }[], prices: Map<string, number>): number {
  return Math.round(lines.reduce((sum, line) => sum + (prices.get(line.key) ?? 0) * line.quantity, 0) * 100) / 100;
}

describe("isPromotionLive", () => {
  it("treats a missing status as active for rows read before the column existed", () => {
    expect(isPromotionLive({}, NOW)).toBe(true);
  });

  it("rejects paused, scheduled and expired promotions", () => {
    expect(isPromotionLive({ status: "paused" }, NOW)).toBe(false);
    expect(isPromotionLive({ valid_from: "2026-10-22T00:00:00Z" }, NOW)).toBe(false);
    expect(isPromotionLive({ valid_until: "2026-10-20T00:00:00Z" }, NOW)).toBe(false);
  });
});

describe("applyUnitPromotion", () => {
  it("caps percentage discounts", () => {
    expect(applyUnitPromotion(100, { type: "percentage", value: 150 })).toEqual({ finalPrice: 10, discountPercent: 90 });
  });

  it("never prices below zero or above the list price", () => {
    expect(applyUnitPromotion(30, { type: "fixed_amount", value: 50 }).finalPrice).toBe(0);
    expect(applyUnitPromotion(30, { type: "fixed_price", value: 45 }).finalPrice).toBe(30);
  });
});

describe("bestUnitPromotion", () => {
  const product = { id: "p1", price: 100, subcatalog_id: "s1" };

  it("ignores pack and nxm promotions so a pack price never leaks to a single item", () => {
    const result = bestUnitPromotion(
      [
        { id: "pack", type: "bundle_price", value: 10, product_ids: ["p1"] },
        { id: "two-for-one", type: "nxm", value: 0, product_ids: ["p1"] },
      ],
      product,
      NOW,
    );
    expect(result).toBeNull();
  });

  it("honors applies_to for subcatalogs and the whole catalog", () => {
    expect(bestUnitPromotion([{ id: "cat", type: "percentage", value: 10, applies_to: "subcatalogs", subcatalog_ids: ["s1"] }], product, NOW)?.finalPrice).toBe(90);
    expect(bestUnitPromotion([{ id: "all", type: "fixed_amount", value: 5, applies_to: "all" }], product, NOW)?.finalPrice).toBe(95);
    expect(bestUnitPromotion([{ id: "other", type: "percentage", value: 10, applies_to: "subcatalogs", subcatalog_ids: ["s2"] }], product, NOW)).toBeNull();
  });

  it("picks the cheapest live promotion", () => {
    const result = bestUnitPromotion(
      [
        { id: "ten", type: "percentage", value: 10, product_ids: ["p1"] },
        { id: "special", type: "fixed_price", value: 80, product_ids: ["p1"] },
        { id: "expired", type: "fixed_price", value: 50, product_ids: ["p1"], valid_until: "2026-10-01T00:00:00Z" },
      ],
      product,
      NOW,
    );
    expect(result?.promotionId).toBe("special");
  });
});

describe("allocatePackPrice", () => {
  it("charges exactly the pack price for single units", () => {
    const lines = [
      { key: "a", listUnitPrice: 45, quantity: 1 },
      { key: "b", listUnitPrice: 35, quantity: 1 },
      { key: "c", listUnitPrice: 40, quantity: 1 },
    ];
    expect(charged(lines, allocatePackPrice(lines, 99.99))).toBe(99.99);
  });

  it("never charges more than the pack price when quantities don't divide the cents", () => {
    const lines = [{ key: "beer", listUnitPrice: 40, quantity: 3 }];
    const total = charged(lines, allocatePackPrice(lines, 100));
    expect(total).toBeLessThanOrEqual(100);
    expect(100 - total).toBeLessThan(0.03);
  });

  it("splits in proportion to list value", () => {
    const prices = allocatePackPrice(
      [
        { key: "expensive", listUnitPrice: 300, quantity: 1 },
        { key: "cheap", listUnitPrice: 100, quantity: 1 },
      ],
      200,
    );
    expect(prices.get("expensive")).toBe(150);
    expect(prices.get("cheap")).toBe(50);
  });

  it("reports the savings against list price", () => {
    expect(packSavings([{ key: "a", listUnitPrice: 50, quantity: 2 }], 80)).toBe(20);
  });
});

describe("nxmUnitPrice", () => {
  it("prices a 2x1 at half per unit and a 3x2 at two thirds", () => {
    expect(nxmUnitPrice(85, 2, 1)).toBe(42.5);
    expect(nxmUnitPrice(30, 3, 2) * 3).toBeLessThanOrEqual(60);
  });

  it("falls back to list price for invalid combinations", () => {
    expect(nxmUnitPrice(50, 2, 2)).toBe(50);
  });
});
