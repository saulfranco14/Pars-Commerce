import { describe, expect, it } from "vitest";

import {
  fitSelectionToOptions,
  planChargeItems,
  planCheckoutProblem,
  plansTotal,
  restrictCheckoutForPlans,
} from "@/features/checkout/helpers/planCheckout";

import type { CartPlanLine } from "@/types/cart";

function line(overrides: Partial<CartPlanLine["plan"]> = {}, price = 559): CartPlanLine {
  return {
    id: "line-1",
    offer_plan_id: "plan-1",
    billing_method: "manual",
    price_snapshot: price,
    plan: {
      id: "plan-1",
      kind: "subscription",
      status: "active",
      name: "Despensa Básica",
      slug: "despensa-basica",
      image_url: null,
      interval_unit: "month",
      interval_count: 1,
      max_periods: null,
      fulfillment_methods: ["pickup"],
      preferred_weekday: null,
      items_count: 7,
      ...overrides,
    },
  };
}

describe("planCheckoutProblem", () => {
  it("lets carts without plans through untouched", () => {
    expect(planCheckoutProblem([], { mode: "partial", fulfillmentMethod: "delivery" })).toBeNull();
  });

  it("requires a single payment when the cart has a plan", () => {
    expect(planCheckoutProblem([line()], { mode: "subscription", fulfillmentMethod: "pickup" })).toMatch(/un solo pago/);
  });

  it("rejects a delivery method the plan does not offer", () => {
    expect(planCheckoutProblem([line()], { mode: "single", fulfillmentMethod: "delivery" })).toMatch(/no tiene entrega a domicilio/);
    expect(planCheckoutProblem([line({ fulfillment_methods: ["delivery"] })], { mode: "single", fulfillmentMethod: "pickup" })).toMatch(
      /sólo se entrega a domicilio/,
    );
    expect(planCheckoutProblem([line()], { mode: "single", fulfillmentMethod: "pickup" })).toBeNull();
  });
});

describe("plan totals and payment lines", () => {
  it("adds every plan's first period and names it for Mercado Pago", () => {
    const plans = [line(), { ...line({ name: "Pan semanal" }, 120.1), id: "line-2", offer_plan_id: "plan-2" }];
    expect(plansTotal(plans)).toBe(679.1);
    expect(planChargeItems(plans)).toEqual([
      { id: "plan-plan-1", title: "Despensa Básica · primer periodo", quantity: 1, unit_price: 559, currency_id: "MXN" },
      { id: "plan-plan-2", title: "Pan semanal · primer periodo", quantity: 1, unit_price: 120.1, currency_id: "MXN" },
    ]);
  });
});

describe("restrictCheckoutForPlans", () => {
  const options = { deliveryEnabled: true, pickupEnabled: true, deliveryFee: 30 };

  it("keeps the store's options when there are no plans", () => {
    expect(restrictCheckoutForPlans(options, [])).toBe(options);
  });

  it("only offers what every plan in the cart allows", () => {
    expect(restrictCheckoutForPlans(options, [line()])).toMatchObject({ deliveryEnabled: false, pickupEnabled: true, deliveryFee: 30 });
    expect(restrictCheckoutForPlans(options, [line({ fulfillment_methods: ["pickup", "delivery"] })])).toMatchObject({
      deliveryEnabled: true,
      pickupEnabled: true,
    });
  });

  it("moves the selection to the method that is still allowed", () => {
    expect(fitSelectionToOptions({ fulfillment: "delivery" as const }, { deliveryEnabled: false, pickupEnabled: true })).toEqual({ fulfillment: "pickup" });
    expect(fitSelectionToOptions({ fulfillment: "pickup" as const }, { deliveryEnabled: true, pickupEnabled: true })).toEqual({ fulfillment: "pickup" });
  });
});
