import { describe, expect, it } from "vitest";

import { findBestNxmPromotionForProduct } from "@/lib/offers/groupPricing";
import type { PricingPromotion } from "@/lib/offers/pricing";

const prices = new Map([["papas", 55]]);

function nxm(id: string, buy: number, pay: number): PricingPromotion {
  return {
    id,
    type: "nxm",
    value: 0,
    product_ids: ["papas"],
    buy_quantity: buy,
    pay_quantity: pay,
    status: "active",
    sales_channels: ["onsite"],
  };
}

describe("findBestNxmPromotionForProduct", () => {
  it("selects the eligible deal with the lowest effective unit price", () => {
    const result = findBestNxmPromotionForProduct(
      [nxm("3x2", 3, 2), nxm("2x1", 2, 1)],
      "papas",
      prices,
      { channel: "onsite", cartListSubtotal: 110 },
    );

    expect(result?.promotion.id).toBe("2x1");
    expect(result?.plan).toMatchObject([{ productId: "papas", unitQuantity: 2, unitPrice: 27.5 }]);
  });

  it("does not surface an onsite deal when the business disabled local promotions", () => {
    const result = findBestNxmPromotionForProduct(
      [nxm("2x1", 2, 1)],
      "papas",
      prices,
      { channel: "onsite", onsitePromotionsEnabled: false, cartListSubtotal: 110 },
    );

    expect(result).toBeNull();
  });
});
