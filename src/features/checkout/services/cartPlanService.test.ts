import { describe, expect, it } from "vitest";
import type { SupabaseClient } from "@supabase/supabase-js";

import { createFakeSupabase } from "@/test/fakeSupabase";

import { addPlanToCart, MAX_PLANS_PER_CART, removePlanFromCart, repriceCartPlans } from "@/features/checkout/services/cartPlanService";

const TENANT = "tenant-1";
const CART = "cart-1";

const asClient = (db: ReturnType<typeof createFakeSupabase>) => db as unknown as SupabaseClient;

function plan(id: string, overrides: Record<string, unknown> = {}) {
  return { id, tenant_id: TENANT, status: "active", price: 559, max_active_members: null, ...overrides };
}

function seed(extra: Record<string, Record<string, unknown>[]> = {}) {
  return createFakeSupabase({
    offer_plans: [plan("despensa"), plan("paused", { status: "paused" }), plan("full", { max_active_members: 1 })],
    public_cart_plans: [],
    subscriptions: [{ id: "s1", offer_plan_id: "full", status: "active" }],
    ...extra,
  });
}

describe("addPlanToCart", () => {
  it("adds an active plan at its current price, once", async () => {
    const db = seed();
    await addPlanToCart(asClient(db), { cartId: CART, tenantId: TENANT, planId: "despensa" });
    const again = await addPlanToCart(asClient(db), { cartId: CART, tenantId: TENANT, planId: "despensa" });
    expect(again).toEqual({ ok: true, data: null });
    expect(db.rowsOf("public_cart_plans")).toEqual([
      expect.objectContaining({ cart_id: CART, offer_plan_id: "despensa", price_snapshot: 559, billing_method: "manual" }),
    ]);
  });

  it("refuses paused plans, plans of another business and plans without seats", async () => {
    const db = seed();
    expect(await addPlanToCart(asClient(db), { cartId: CART, tenantId: TENANT, planId: "paused" })).toMatchObject({ ok: false });
    expect(await addPlanToCart(asClient(db), { cartId: CART, tenantId: "other", planId: "despensa" })).toMatchObject({ ok: false });
    expect(await addPlanToCart(asClient(db), { cartId: CART, tenantId: TENANT, planId: "full" })).toMatchObject({
      ok: false,
      error: { code: "conflict" },
    });
    expect(db.rowsOf("public_cart_plans")).toEqual([]);
  });

  it("caps how many plans one cart can carry", async () => {
    const existing = Array.from({ length: MAX_PLANS_PER_CART }, (_, i) => ({ id: `l${i}`, cart_id: CART, offer_plan_id: `p${i}` }));
    const db = seed({ public_cart_plans: existing });
    expect(await addPlanToCart(asClient(db), { cartId: CART, tenantId: TENANT, planId: "despensa" })).toMatchObject({ ok: false });
  });
});

describe("removePlanFromCart", () => {
  it("only removes the plan from the given cart", async () => {
    const db = seed({
      public_cart_plans: [
        { id: "mine", cart_id: CART, offer_plan_id: "despensa" },
        { id: "theirs", cart_id: "cart-2", offer_plan_id: "despensa" },
      ],
    });
    await removePlanFromCart(asClient(db), { cartId: CART, planLineId: "theirs" });
    expect(db.rowsOf("public_cart_plans")).toHaveLength(2);
    await removePlanFromCart(asClient(db), { cartId: CART, planLineId: "mine" });
    expect(db.rowsOf("public_cart_plans").map((row) => row.id)).toEqual(["theirs"]);
  });
});

describe("repriceCartPlans", () => {
  it("drops plans that left the store and refreshes changed prices", async () => {
    const db = seed({
      offer_plans: [plan("despensa", { price: 599 }), plan("paused", { status: "paused" }), plan("same")],
      public_cart_plans: [
        { id: "a", cart_id: CART, offer_plan_id: "despensa", price_snapshot: 559 },
        { id: "b", cart_id: CART, offer_plan_id: "paused", price_snapshot: 559 },
        { id: "c", cart_id: CART, offer_plan_id: "same", price_snapshot: "559.00" },
      ],
    });
    expect(await repriceCartPlans(asClient(db), CART)).toEqual({ ok: true, data: { changed: true } });
    expect(db.rowsOf("public_cart_plans").map((row) => [row.id, Number(row.price_snapshot)])).toEqual([
      ["a", 599],
      ["c", 559],
    ]);
    expect(await repriceCartPlans(asClient(db), CART)).toEqual({ ok: true, data: { changed: false } });
  });
});
