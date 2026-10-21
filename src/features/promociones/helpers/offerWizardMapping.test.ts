import { describe, expect, it } from "vitest";

import {
  EMPTY_WIZARD_VALUES,
  toPromotionPayload,
  valuesFromPromotion,
  valuesFromTemplate,
} from "@/features/promociones/helpers/offerWizardMapping";
import { offerWizardSchema } from "@/features/promociones/validations/offerWizardSchema";

const TODAY = new Date("2026-10-21T12:00:00");

describe("valuesFromTemplate", () => {
  it("pre-fills the mechanic, value and validity", () => {
    expect(valuesFromTemplate("nxm", TODAY)).toMatchObject({
      templateKey: "nxm",
      mechanic: "nxm",
      buyQuantity: 2,
      payQuantity: 1,
      validity: "weekend",
      validFrom: "2026-10-23",
      validUntil: "2026-10-25",
    });
  });

  it("starts empty for templates of later phases", () => {
    expect(valuesFromTemplate("club_lavado", TODAY).templateKey).toBeNull();
  });
});

describe("toPromotionPayload", () => {
  it("sends a whole-store percentage as applies_to all without product ids", () => {
    const payload = toPromotionPayload({ ...EMPTY_WIZARD_VALUES, name: "Todo -15", mechanic: "percentage", value: "15", appliesToAll: true }, "active");
    expect(payload).toMatchObject({ applies_to: "all", product_ids: [], value: 15, valid_from: null, valid_until: null });
  });

  it("sends pack items for a bundle and quantities for a 2x1", () => {
    expect(
      toPromotionPayload({ ...EMPTY_WIZARD_VALUES, name: "Combo", mechanic: "bundle_price", value: "199", packItems: [{ product_id: "a", quantity: 2 }] }, "draft"),
    ).toMatchObject({ items: [{ product_id: "a", quantity: 2 }], status: "draft", product_ids: [] });
    expect(
      toPromotionPayload({ ...EMPTY_WIZARD_VALUES, name: "2x1", mechanic: "nxm", productIds: ["t"], buyQuantity: 3, payQuantity: 2 }, "active"),
    ).toMatchObject({ buy_quantity: 3, pay_quantity: 2, value: 0, product_ids: ["t"] });
  });

  it("round-trips an existing promotion through the form", () => {
    const values = valuesFromPromotion({
      id: "p",
      name: "Combo",
      type: "bundle_price",
      value: 199,
      status: "active",
      applies_to: "products",
      template_key: "combo",
      product_ids: null,
      subcatalog_ids: null,
      bundle_product_ids: ["a", "b"],
      buy_quantity: null,
      pay_quantity: null,
      badge_label: null,
      valid_from: null,
      valid_until: null,
      description: null,
      image_url: null,
      promotion_items: [
        { product_id: "b", quantity: 1, position: 1 },
        { product_id: "a", quantity: 2, position: 0 },
      ],
    });
    expect(values.packItems).toEqual([
      { product_id: "a", quantity: 2 },
      { product_id: "b", quantity: 1 },
    ]);
    expect(toPromotionPayload(values, "active")).toMatchObject({ type: "bundle_price", value: 199, items: values.packItems });
  });
});

describe("offerWizardSchema", () => {
  const valid = { ...EMPTY_WIZARD_VALUES, name: "Promo", mechanic: "percentage" as const, value: "10", productIds: ["p"] };

  it("accepts a complete percentage promotion", async () => {
    await expect(offerWizardSchema.validate(valid)).resolves.toBeTruthy();
  });

  it("requires products, a category or the whole store", async () => {
    await expect(offerWizardSchema.validate({ ...valid, productIds: [] })).rejects.toThrow(/toda la tienda/);
    await expect(offerWizardSchema.validate({ ...valid, productIds: [], appliesToAll: true })).resolves.toBeTruthy();
  });

  it("requires exactly one product for a 2x1 and fewer paid than taken", async () => {
    await expect(offerWizardSchema.validate({ ...valid, mechanic: "nxm", productIds: ["a", "b"] })).rejects.toThrow(/un producto/);
    await expect(offerWizardSchema.validate({ ...valid, mechanic: "nxm", buyQuantity: 2, payQuantity: 2 })).rejects.toThrow(/menos piezas/);
  });

  it("requires at least two pieces in a pack", async () => {
    await expect(
      offerWizardSchema.validate({ ...valid, mechanic: "bundle_price", value: "99", packItems: [{ product_id: "a", quantity: 1 }] }),
    ).rejects.toThrow(/2 piezas/);
  });

  it("requires an end date for custom validity", async () => {
    await expect(offerWizardSchema.validate({ ...valid, validity: "custom", validFrom: "2026-10-21", validUntil: "" })).rejects.toThrow(/hasta cuándo/);
  });
});
