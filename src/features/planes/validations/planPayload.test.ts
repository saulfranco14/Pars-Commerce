import { describe, expect, it } from "vitest";

import { normalizePlanInput } from "@/features/planes/validations/planPayload";

import type { OfferPlanWriteInput } from "@/features/planes/interfaces/offerPlan";

const despensa: OfferPlanWriteInput = {
  kind: "subscription",
  name: "  Despensa Básica ",
  price: 559.004,
  interval_unit: "month",
  interval_count: 1,
  fulfillment_methods: ["pickup", "delivery"],
  items: [
    { product_id: "rice", quantity: 2 },
    { product_id: "beans", quantity: 1 },
    { product_id: "rice", quantity: 1 },
  ],
};

describe("normalizePlanInput", () => {
  it("normalizes a subscription and merges repeated products", () => {
    const result = normalizePlanInput(despensa, "create");
    if (!result.ok) throw new Error(result.message);
    expect(result.data.fields).toMatchObject({
      kind: "subscription",
      name: "Despensa Básica",
      price: 559,
      billing_methods: ["manual"],
      fulfillment_methods: ["pickup", "delivery"],
    });
    expect(result.data.items).toEqual([
      { product_id: "rice", product_variant_id: null, quantity: 3 },
      { product_id: "beans", product_variant_id: null, quantity: 1 },
    ]);
  });

  it("requires products, a price and a delivery method on create", () => {
    expect(normalizePlanInput({ ...despensa, items: [] }, "create")).toMatchObject({ ok: false });
    expect(normalizePlanInput({ ...despensa, price: 0 }, "create")).toMatchObject({ ok: false });
    expect(normalizePlanInput({ ...despensa, fulfillment_methods: [] }, "create")).toMatchObject({ ok: false });
    expect(normalizePlanInput({ ...despensa, fulfillment_methods: ["in_store"] }, "create")).toMatchObject({ ok: false });
  });

  it("holds back memberships and automatic billing until their phase", () => {
    expect(normalizePlanInput({ ...despensa, kind: "membership" }, "create")).toEqual({
      ok: false,
      message: "Las membresías estarán disponibles pronto.",
    });
    expect(normalizePlanInput({ ...despensa, billing_methods: ["manual", "mp_auto"] }, "create")).toMatchObject({ ok: false });
  });

  it("validates interval, duration and weekday ranges", () => {
    expect(normalizePlanInput({ ...despensa, interval_unit: "year" }, "create")).toMatchObject({ ok: false });
    expect(normalizePlanInput({ ...despensa, interval_count: 13 }, "create")).toMatchObject({ ok: false });
    expect(normalizePlanInput({ ...despensa, max_periods: 0 }, "create")).toMatchObject({ ok: false });
    expect(normalizePlanInput({ ...despensa, preferred_weekday: 7 }, "create")).toMatchObject({ ok: false });
    expect(normalizePlanInput({ ...despensa, max_periods: null, preferred_weekday: 6 }, "create")).toMatchObject({ ok: true });
  });

  it("only touches the fields sent on update and keeps items when omitted", () => {
    const result = normalizePlanInput({ status: "paused" }, "update", { kind: "subscription" });
    expect(result).toEqual({ ok: true, data: { fields: { status: "paused" }, items: null } });
  });
});
