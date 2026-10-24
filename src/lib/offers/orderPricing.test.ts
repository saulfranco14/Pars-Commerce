import { describe, expect, it } from "vitest";

import { priceOrder } from "@/lib/offers/orderPricing";
import type { PricingPromotion } from "@/lib/offers/pricing";

const products = [
  { id: "papas", price: 55, subcatalog_id: "comida" },
  { id: "cafe", price: 45, subcatalog_id: "bebidas" },
  { id: "servicio", price: 100, subcatalog_id: "servicios" },
];

function promotion(overrides: Partial<PricingPromotion> = {}): PricingPromotion {
  return {
    id: "promo",
    name: "Oferta",
    type: "percentage",
    value: 10,
    status: "active",
    applies_to: "all",
    sales_channels: ["public_store", "onsite"],
    ...overrides,
  };
}

describe("priceOrder", () => {
  it("produce el mismo total para sitio y local cuando ambos canales están activos", () => {
    const input = { products, promotions: [promotion()], intents: [{ productId: "servicio", quantity: 1 }] };
    const site = priceOrder({ ...input, channel: "public_store" });
    const onsite = priceOrder({ ...input, channel: "onsite", onsitePromotionsEnabled: true });
    expect(site.ok && site.total).toBe(90);
    expect(onsite.ok && onsite.total).toBe(90);
  });

  it("respeta canal y corte general del local", () => {
    const intents = [{ productId: "papas", quantity: 2 }];
    const onlySite = promotion({ sales_channels: ["public_store"] });
    const wrongChannel = priceOrder({ products, promotions: [onlySite], intents, channel: "onsite" });
    const disabled = priceOrder({ products, promotions: [promotion()], intents, channel: "onsite", onsitePromotionsEnabled: false });
    expect(wrongChannel.ok && wrongChannel.total).toBe(110);
    expect(disabled.ok && disabled.total).toBe(110);
  });

  it("aplica el mínimo sobre el total normal y escoge la promoción más conveniente", () => {
    const promotions = [
      promotion({ id: "minimum", value: 30, min_amount: 100 }),
      promotion({ id: "cheap", value: 5 }),
    ];
    const below = priceOrder({ products, promotions, intents: [{ productId: "cafe", quantity: 1 }], channel: "onsite" });
    const above = priceOrder({ products, promotions, intents: [{ productId: "papas", quantity: 2 }], channel: "onsite" });
    expect(below.ok && below.total).toBe(42.75);
    expect(above.ok && above.total).toBe(77);
    expect(above.ok && above.lines[0].promotionId).toBe("minimum");
  });

  it("cobra un 2x1 como grupo y rechaza una cantidad incompleta", () => {
    const nxm = promotion({
      id: "dos-por-uno",
      type: "nxm",
      value: 0,
      applies_to: "products",
      product_ids: ["papas"],
      buy_quantity: 2,
      pay_quantity: 1,
    });
    const complete = priceOrder({
      products,
      promotions: [nxm],
      intents: [{ productId: "papas", quantity: 2, promotionId: nxm.id, offerGroupId: "grupo" }],
      channel: "onsite",
    });
    const incomplete = priceOrder({
      products,
      promotions: [nxm],
      intents: [{ productId: "papas", quantity: 1, promotionId: nxm.id, offerGroupId: "grupo" }],
      channel: "onsite",
    });
    expect(complete.ok && complete.total).toBe(55);
    expect(complete.ok && complete.savings).toBe(55);
    expect(incomplete.ok).toBe(false);
  });

  it("mantiene el total exacto de un paquete sin apilar descuentos unitarios", () => {
    const pack = promotion({
      id: "combo",
      name: "Combo",
      type: "bundle_price",
      value: 80,
      promotion_items: [
        { product_id: "papas", quantity: 1 },
        { product_id: "cafe", quantity: 1 },
      ],
    });
    const automatic = promotion({ id: "auto", value: 50 });
    const result = priceOrder({
      products,
      promotions: [pack, automatic],
      intents: [
        { productId: "papas", quantity: 1, promotionId: pack.id, offerGroupId: "combo-1" },
        { productId: "cafe", quantity: 1, promotionId: pack.id, offerGroupId: "combo-1" },
      ],
      channel: "onsite",
    });
    expect(result.ok && result.total).toBe(80);
    expect(result.ok && result.lines.every((line) => line.promotionId === "combo")).toBe(true);
  });
});
