import { describe, expect, it } from "vitest";

import {
  EMPTY_PLAN_VALUES,
  planListValue,
  planValuesFromPlan,
  planValuesFromTemplate,
  suggestPlanName,
  toPlanPayload,
} from "@/features/planes/helpers/planWizardMapping";
import { normalizePlanInput } from "@/features/planes/validations/planPayload";
import { planWizardSchema } from "@/features/planes/validations/planWizardSchema";

import type { OfferPlan } from "@/features/planes/interfaces/offerPlan";

const prices: Record<string, number> = { rice: 30, beans: 40 };
const names: Record<string, string> = { rice: "Arroz", beans: "Frijol" };

describe("plan wizard mapping", () => {
  it("starts from a template's interval, delivery and weekday", () => {
    expect(planValuesFromTemplate("despensa_mensual")).toMatchObject({
      templateKey: "despensa_mensual",
      intervalUnit: "month",
      fulfillmentMethods: ["pickup", "delivery"],
      preferredWeekday: 6,
    });
    expect(planValuesFromTemplate("pan_semanal")).toMatchObject({ intervalUnit: "week", fulfillmentMethods: ["pickup"] });
    expect(planValuesFromTemplate("dos_por_uno")).toEqual(EMPTY_PLAN_VALUES);
  });

  it("produces a payload the server accepts", () => {
    const values = {
      ...planValuesFromTemplate("despensa_mensual"),
      items: [{ product_id: "rice", quantity: 2 }, { product_id: "beans", quantity: 1 }],
      price: "89.999",
      maxActiveMembers: "50",
      name: "Despensa Básica",
    };
    expect(planWizardSchema.isValidSync(values)).toBe(true);
    const payload = toPlanPayload(values, "active");
    expect(payload).toMatchObject({ price: 90, max_active_members: 50, billing_methods: ["manual"], status: "active" });
    expect(normalizePlanInput(payload, "create")).toMatchObject({ ok: true });
  });

  it("round-trips a stored plan for editing", () => {
    const plan = {
      id: "p1", tenant_id: "t", kind: "subscription", status: "active", template_key: null, name: "Pan", slug: "pan",
      description: null, image_url: null, price: 120, interval_unit: "week", interval_count: 1, max_periods: 6,
      billing_methods: ["manual"], fulfillment_methods: ["pickup"], preferred_weekday: 6, renewal_lead_days: 2,
      grace_days: 3, max_active_members: null, created_at: "", items: [{ product_id: "rice", product_variant_id: null, quantity: 3 }],
    } as OfferPlan;
    const values = planValuesFromPlan(plan);
    expect(values).toMatchObject({ price: "120.00", maxPeriods: 6, maxActiveMembers: "", items: [{ product_id: "rice", quantity: 3 }] });
    expect(toPlanPayload(values, "active")).toMatchObject({ price: 120, max_periods: 6, renewal_lead_days: 2, grace_days: 3 });
  });

  it("values the products at list price and suggests a name", () => {
    const items = [{ product_id: "rice", quantity: 2 }, { product_id: "beans", quantity: 1 }];
    expect(planListValue(items, (id) => prices[id])).toBe(100);
    expect(suggestPlanName({ ...EMPTY_PLAN_VALUES, items }, (id) => names[id])).toBe("Arroz y más cada mes");
    expect(suggestPlanName({ ...EMPTY_PLAN_VALUES, items: items.slice(0, 1), intervalUnit: "week" }, (id) => names[id])).toBe("Arroz cada semana");
    expect(suggestPlanName({ ...planValuesFromTemplate("pan_semanal"), items }, (id) => names[id])).toBe("Pan de la semana");
  });

  it("rejects an empty plan and a missing price per step", () => {
    expect(planWizardSchema.isValidSync({ ...EMPTY_PLAN_VALUES, name: "Plan" })).toBe(false);
    expect(planWizardSchema.isValidSync({ ...EMPTY_PLAN_VALUES, name: "Plan", items: [{ product_id: "rice", quantity: 1 }], price: "0" })).toBe(false);
  });
});
