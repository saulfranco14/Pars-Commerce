import { describe, expect, it } from "vitest";

import { normalizePromotionInput } from "@/features/promociones/validations/promotionPayload";

describe("normalizePromotionInput", () => {
  it("makes an empty product list apply to the whole catalog, as the form promises", () => {
    const result = normalizePromotionInput({ name: "Todo al 10", type: "percentage", value: 10, product_ids: [] }, "create");
    expect(result.ok && result.data.fields.applies_to).toBe("all");
  });

  it("targets subcatalogs when only subcatalogs were chosen", () => {
    const result = normalizePromotionInput({ name: "Bebidas", type: "percentage", value: 10, subcatalog_ids: ["s1"] }, "create");
    expect(result.ok && result.data.fields.applies_to).toBe("subcatalogs");
  });

  it("rejects out-of-range percentages and non-positive amounts", () => {
    expect(normalizePromotionInput({ name: "Mal", type: "percentage", value: 95 }, "create").ok).toBe(false);
    expect(normalizePromotionInput({ name: "Mal", type: "fixed_price", value: 0, product_ids: ["p"] }, "create").ok).toBe(false);
  });

  it("validates 2x1 quantities and requires a product", () => {
    expect(normalizePromotionInput({ name: "2x1", type: "nxm", buy_quantity: 2, pay_quantity: 2, product_ids: ["p"] }, "create").ok).toBe(false);
    expect(normalizePromotionInput({ name: "2x1", type: "nxm", buy_quantity: 2, pay_quantity: 1 }, "create").ok).toBe(false);
    const ok = normalizePromotionInput({ name: "2x1", type: "nxm", buy_quantity: 2, pay_quantity: 1, product_ids: ["p"] }, "create");
    expect(ok.ok && ok.data.fields).toMatchObject({ buy_quantity: 2, pay_quantity: 1, value: 0 });
  });

  it("merges duplicated pack items and keeps the bundle id list in sync", () => {
    const result = normalizePromotionInput(
      {
        name: "Combo",
        type: "bundle_price",
        value: 99,
        items: [
          { product_id: "a", quantity: 1 },
          { product_id: "a", quantity: 2 },
          { product_id: "b", quantity: 1 },
        ],
      },
      "create",
    );
    expect(result.ok && result.data.items).toEqual([
      { product_id: "a", quantity: 3 },
      { product_id: "b", quantity: 1 },
    ]);
    expect(result.ok && result.data.fields.bundle_product_ids).toEqual(["a", "b"]);
  });

  it("requires the end date after the start date, also on partial updates", () => {
    const result = normalizePromotionInput({ valid_until: "2026-10-01" }, "update", { type: "percentage", valid_from: "2026-10-10" });
    expect(result.ok).toBe(false);
  });

  it("only touches the fields sent on update", () => {
    const result = normalizePromotionInput({ status: "paused" }, "update", { type: "percentage", value: 10 });
    expect(result.ok && result.data).toEqual({ fields: { status: "paused" }, items: null });
  });
});
