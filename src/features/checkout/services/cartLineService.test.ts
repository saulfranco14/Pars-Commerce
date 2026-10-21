import { describe, expect, it } from "vitest";
import type { SupabaseClient } from "@supabase/supabase-js";

import { createFakeSupabase } from "@/test/fakeSupabase";

import {
  addProductLine,
  addPromotionGroup,
  removeLine,
  setLineQuantity,
} from "@/features/checkout/services/cartLineService";

const TENANT = "tenant-1";
const CART = "cart-1";

const asClient = (db: ReturnType<typeof createFakeSupabase>) => db as unknown as SupabaseClient;

function seed(extra: Record<string, Record<string, unknown>[]> = {}) {
  return createFakeSupabase({
    products: [
      { id: "beer", tenant_id: TENANT, price: 40, has_variants: false, subcatalog_id: "drinks", is_public: true, deleted_at: null },
      { id: "chips", tenant_id: TENANT, price: 30, has_variants: false, subcatalog_id: "snacks", is_public: true, deleted_at: null },
      { id: "taco", tenant_id: TENANT, price: 85, has_variants: false, subcatalog_id: null, is_public: true, deleted_at: null },
    ],
    promotions: [],
    public_cart_items: [],
    ...extra,
  });
}

const packPromotion = {
  id: "pack",
  tenant_id: TENANT,
  type: "bundle_price",
  value: 99,
  status: "active",
  applies_to: "products",
  quantity: null,
  buy_quantity: null,
  pay_quantity: null,
  product_ids: [],
  subcatalog_ids: [],
  bundle_product_ids: ["beer", "chips"],
  valid_from: null,
  valid_until: null,
  promotion_items: [
    { product_id: "beer", quantity: 2, position: 0 },
    { product_id: "chips", quantity: 1, position: 1 },
  ],
};

describe("addProductLine", () => {
  it("adds to an existing standalone line instead of overwriting it", async () => {
    const db = seed();
    await addProductLine(asClient(db), { cartId: CART, tenantId: TENANT, productId: "beer", quantity: 1 });
    await addProductLine(asClient(db), { cartId: CART, tenantId: TENANT, productId: "beer", quantity: 2 });
    const lines = db.rowsOf("public_cart_items");
    expect(lines).toHaveLength(1);
    expect(lines[0]).toMatchObject({ quantity: 3, price_snapshot: 40, list_unit_price: 40, promotion_id: null });
  });

  it("applies the best live unit promotion, including by subcatalog", async () => {
    const db = seed({
      promotions: [
        { id: "drinks10", tenant_id: TENANT, type: "percentage", value: 10, status: "active", applies_to: "subcatalogs", subcatalog_ids: ["drinks"], product_ids: [] },
        { id: "paused", tenant_id: TENANT, type: "fixed_price", value: 5, status: "paused", applies_to: "products", product_ids: ["beer"] },
      ],
    });
    await addProductLine(asClient(db), { cartId: CART, tenantId: TENANT, productId: "beer", quantity: 1 });
    expect(db.rowsOf("public_cart_items")[0]).toMatchObject({ price_snapshot: 36, promotion_id: "drinks10" });
  });

  it("does not leak a pack price to a product bought alone", async () => {
    const db = seed({ promotions: [packPromotion] });
    await addProductLine(asClient(db), { cartId: CART, tenantId: TENANT, productId: "beer", quantity: 1 });
    expect(db.rowsOf("public_cart_items")[0]).toMatchObject({ price_snapshot: 40, promotion_id: null });
  });

  it("rejects a product that is not public", async () => {
    const db = seed();
    const result = await addProductLine(asClient(db), { cartId: CART, tenantId: TENANT, productId: "missing", quantity: 1 });
    expect(result.ok).toBe(false);
  });
});

describe("addPromotionGroup", () => {
  it("adds a pack as one group priced to the pack total and keeps the standalone line apart", async () => {
    const db = seed({ promotions: [packPromotion] });
    await addProductLine(asClient(db), { cartId: CART, tenantId: TENANT, productId: "beer", quantity: 1 });
    const result = await addPromotionGroup(asClient(db), { cartId: CART, tenantId: TENANT, promotionId: "pack" });
    expect(result.ok).toBe(true);

    const lines = db.rowsOf("public_cart_items");
    const grouped = lines.filter((line) => line.group_id);
    expect(lines).toHaveLength(3);
    expect(new Set(grouped.map((line) => line.group_id)).size).toBe(1);
    const packTotal = grouped.reduce((sum, line) => sum + Number(line.price_snapshot) * Number(line.quantity), 0);
    expect(Math.round(packTotal * 100) / 100).toBeLessThanOrEqual(99);
    expect(99 - packTotal).toBeLessThan(0.02);
  });

  it("adding the same pack again adds one more pack to the same group", async () => {
    const db = seed({ promotions: [packPromotion] });
    await addPromotionGroup(asClient(db), { cartId: CART, tenantId: TENANT, promotionId: "pack" });
    await addPromotionGroup(asClient(db), { cartId: CART, tenantId: TENANT, promotionId: "pack" });
    const lines = db.rowsOf("public_cart_items");
    expect(lines).toHaveLength(2);
    expect(lines.find((line) => line.product_id === "beer")?.quantity).toBe(4);
    expect(lines.find((line) => line.product_id === "chips")?.quantity).toBe(2);
  });

  it("prices a 2x1 as a group of two units", async () => {
    const db = seed({
      promotions: [{ ...packPromotion, id: "2x1", type: "nxm", value: 0, buy_quantity: 2, pay_quantity: 1, product_ids: ["taco"], bundle_product_ids: [], promotion_items: [] }],
    });
    await addPromotionGroup(asClient(db), { cartId: CART, tenantId: TENANT, promotionId: "2x1" });
    expect(db.rowsOf("public_cart_items")[0]).toMatchObject({ product_id: "taco", quantity: 2, group_unit_quantity: 2, price_snapshot: 42.5 });
  });

  it("refuses an expired promotion", async () => {
    const db = seed({ promotions: [{ ...packPromotion, valid_until: "2020-01-01T00:00:00Z" }] });
    const result = await addPromotionGroup(asClient(db), { cartId: CART, tenantId: TENANT, promotionId: "pack" });
    expect(result).toMatchObject({ ok: false, error: { code: "conflict" } });
  });
});

describe("setLineQuantity and removeLine", () => {
  async function cartWithPack() {
    const db = seed({ promotions: [packPromotion] });
    await addPromotionGroup(asClient(db), { cartId: CART, tenantId: TENANT, promotionId: "pack" });
    return db;
  }

  it("moves the whole pack one step when a pack line changes", async () => {
    const db = await cartWithPack();
    const chips = db.rowsOf("public_cart_items").find((line) => line.product_id === "chips")!;
    await setLineQuantity(asClient(db), { cartId: CART, itemId: chips.id as string, quantity: 2 });
    const lines = db.rowsOf("public_cart_items");
    expect(lines.find((line) => line.product_id === "beer")?.quantity).toBe(4);
    expect(lines.find((line) => line.product_id === "chips")?.quantity).toBe(2);
  });

  it("removes the whole pack when one of its lines is removed", async () => {
    const db = await cartWithPack();
    const beer = db.rowsOf("public_cart_items").find((line) => line.product_id === "beer")!;
    await removeLine(asClient(db), { cartId: CART, itemId: beer.id as string });
    expect(db.rowsOf("public_cart_items")).toHaveLength(0);
  });

  it("deletes a standalone line when its quantity drops below one", async () => {
    const db = seed();
    await addProductLine(asClient(db), { cartId: CART, tenantId: TENANT, productId: "chips", quantity: 1 });
    const line = db.rowsOf("public_cart_items")[0];
    await setLineQuantity(asClient(db), { cartId: CART, itemId: line.id as string, quantity: 0 });
    expect(db.rowsOf("public_cart_items")).toHaveLength(0);
  });
});
