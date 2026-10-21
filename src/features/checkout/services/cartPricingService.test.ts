import { describe, expect, it } from "vitest";
import type { SupabaseClient } from "@supabase/supabase-js";

import { createFakeSupabase } from "@/test/fakeSupabase";

import { repriceCart } from "@/features/checkout/services/cartPricingService";

const TENANT = "tenant-1";
const CART = "cart-1";
const asClient = (db: ReturnType<typeof createFakeSupabase>) => db as unknown as SupabaseClient;

const products = [
  { id: "beer", tenant_id: TENANT, price: 40, has_variants: false, subcatalog_id: null, is_public: true, deleted_at: null },
  { id: "chips", tenant_id: TENANT, price: 30, has_variants: false, subcatalog_id: null, is_public: true, deleted_at: null },
];

function line(overrides: Record<string, unknown>) {
  return {
    cart_id: CART,
    product_variant_id: null,
    list_unit_price: null,
    promotion_id: null,
    group_id: null,
    group_unit_quantity: null,
    ...overrides,
  };
}

const pack = {
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

describe("repriceCart", () => {
  it("reports no change when every price is current", async () => {
    const db = createFakeSupabase({
      products,
      promotions: [],
      public_cart_items: [line({ id: "l1", product_id: "beer", quantity: 1, price_snapshot: 40 })],
    });
    const result = await repriceCart(asClient(db), { tenantId: TENANT, cartId: CART });
    expect(result).toEqual({ ok: true, data: { changed: false } });
    expect(db.writes).toHaveLength(0);
  });

  it("charges the list price again when the promotion expired", async () => {
    const db = createFakeSupabase({
      products,
      promotions: [{ id: "old", tenant_id: TENANT, type: "fixed_price", value: 20, status: "active", product_ids: ["beer"], valid_until: "2020-01-01T00:00:00Z" }],
      public_cart_items: [line({ id: "l1", product_id: "beer", quantity: 1, price_snapshot: 20, promotion_id: "old" })],
    });
    const result = await repriceCart(asClient(db), { tenantId: TENANT, cartId: CART });
    expect(result).toEqual({ ok: true, data: { changed: true } });
    expect(db.rowsOf("public_cart_items")[0]).toMatchObject({ price_snapshot: 40, promotion_id: null });
  });

  it("removes a line whose product is no longer public", async () => {
    const db = createFakeSupabase({
      products: [{ ...products[0], is_public: false }],
      promotions: [],
      public_cart_items: [line({ id: "l1", product_id: "beer", quantity: 1, price_snapshot: 40 })],
    });
    await repriceCart(asClient(db), { tenantId: TENANT, cartId: CART });
    expect(db.rowsOf("public_cart_items")).toHaveLength(0);
  });

  it("dissolves a pack whose promotion was paused and merges it into the standalone line", async () => {
    const db = createFakeSupabase({
      products,
      promotions: [{ ...pack, status: "paused" }],
      public_cart_items: [
        line({ id: "solo", product_id: "beer", quantity: 1, price_snapshot: 40 }),
        line({ id: "g-beer", product_id: "beer", quantity: 2, price_snapshot: 36, promotion_id: "pack", group_id: "g1", group_unit_quantity: 2 }),
        line({ id: "g-chips", product_id: "chips", quantity: 1, price_snapshot: 27, promotion_id: "pack", group_id: "g1", group_unit_quantity: 1 }),
      ],
    });
    const result = await repriceCart(asClient(db), { tenantId: TENANT, cartId: CART });
    expect(result).toEqual({ ok: true, data: { changed: true } });
    const rows = db.rowsOf("public_cart_items");
    expect(rows.find((row) => row.id === "solo")).toMatchObject({ quantity: 3, price_snapshot: 40 });
    expect(rows.find((row) => row.id === "g-chips")).toMatchObject({ group_id: null, price_snapshot: 30 });
    expect(rows.find((row) => row.id === "g-beer")).toBeUndefined();
  });

  it("keeps a live pack and corrects its split if the pack price changed", async () => {
    const db = createFakeSupabase({
      products,
      promotions: [{ ...pack, value: 90 }],
      public_cart_items: [
        line({ id: "g-beer", product_id: "beer", quantity: 2, price_snapshot: 36, promotion_id: "pack", group_id: "g1", group_unit_quantity: 2 }),
        line({ id: "g-chips", product_id: "chips", quantity: 1, price_snapshot: 27, promotion_id: "pack", group_id: "g1", group_unit_quantity: 1 }),
      ],
    });
    const result = await repriceCart(asClient(db), { tenantId: TENANT, cartId: CART });
    expect(result).toEqual({ ok: true, data: { changed: true } });
    const total = db.rowsOf("public_cart_items").reduce((sum, row) => sum + Number(row.price_snapshot) * Number(row.quantity), 0);
    expect(total).toBeLessThanOrEqual(90);
    expect(90 - total).toBeLessThan(0.02);
  });
});
