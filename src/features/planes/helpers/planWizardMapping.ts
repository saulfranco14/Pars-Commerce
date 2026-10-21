import { formatInterval } from "@/lib/offers/planPeriods";
import { roundMoney } from "@/lib/offers/pricing";

import { findTemplate } from "@/features/promociones/helpers/templateSuggestions";

import type { OfferPlan, OfferPlanWriteInput } from "@/features/planes/interfaces/offerPlan";
import type { PlanItemValue, PlanWizardValues } from "@/features/planes/interfaces/planWizard";

export const EMPTY_PLAN_VALUES: PlanWizardValues = {
  templateKey: null,
  items: [],
  price: "",
  intervalUnit: "month",
  intervalCount: 1,
  maxPeriods: null,
  fulfillmentMethods: ["pickup"],
  preferredWeekday: null,
  renewalLeadDays: 3,
  graceDays: 5,
  maxActiveMembers: "",
  name: "",
  description: "",
  imageUrl: "",
};

export function planValuesFromTemplate(key: string | null): PlanWizardValues {
  const template = findTemplate(key);
  if (!template || template.kind !== "subscription") return { ...EMPTY_PLAN_VALUES };
  const defaults = template.defaults ?? {};
  return {
    ...EMPTY_PLAN_VALUES,
    templateKey: template.key,
    intervalUnit: defaults.planInterval?.unit ?? "month",
    intervalCount: defaults.planInterval?.count ?? 1,
    fulfillmentMethods: [...(defaults.planFulfillment ?? ["pickup"])],
    preferredWeekday: defaults.planWeekday ?? null,
  };
}

export function planValuesFromPlan(plan: OfferPlan): PlanWizardValues {
  return {
    templateKey: plan.template_key,
    items: (plan.items ?? []).map((item) => ({ product_id: item.product_id, quantity: item.quantity })),
    price: Number(plan.price).toFixed(2),
    intervalUnit: plan.interval_unit,
    intervalCount: plan.interval_count,
    maxPeriods: plan.max_periods,
    fulfillmentMethods: plan.fulfillment_methods.filter((method): method is "pickup" | "delivery" => method !== "in_store"),
    preferredWeekday: plan.preferred_weekday,
    renewalLeadDays: plan.renewal_lead_days,
    graceDays: plan.grace_days,
    maxActiveMembers: plan.max_active_members ? String(plan.max_active_members) : "",
    name: plan.name,
    description: plan.description ?? "",
    imageUrl: plan.image_url ?? "",
  };
}

export function toPlanPayload(values: PlanWizardValues, status: "active" | "draft"): OfferPlanWriteInput {
  const members = Number.parseInt(values.maxActiveMembers, 10);
  return {
    kind: "subscription",
    status,
    template_key: values.templateKey,
    name: values.name.trim(),
    description: values.description.trim() || null,
    image_url: values.imageUrl || null,
    price: roundMoney(Number(values.price)),
    interval_unit: values.intervalUnit,
    interval_count: values.intervalCount,
    max_periods: values.maxPeriods,
    billing_methods: ["manual"],
    fulfillment_methods: values.fulfillmentMethods,
    preferred_weekday: values.preferredWeekday,
    renewal_lead_days: values.renewalLeadDays,
    grace_days: values.graceDays,
    max_active_members: Number.isFinite(members) && members > 0 ? members : null,
    items: values.items,
  };
}

/** What the plan's products cost bought one by one, each period. */
export function planListValue(items: PlanItemValue[], priceOf: (productId: string) => number | undefined): number {
  return roundMoney(items.reduce((sum, item) => sum + (priceOf(item.product_id) ?? 0) * item.quantity, 0));
}

/** "Despensa mensual" style name from the first products and the interval. */
export function suggestPlanName(values: PlanWizardValues, nameOf: (productId: string) => string | undefined): string {
  const template = findTemplate(values.templateKey);
  if (template && template.kind === "subscription" && template.key !== "compra_recurrente") return template.title;
  const first = values.items.map((item) => nameOf(item.product_id)).find(Boolean);
  const every = formatInterval({ unit: values.intervalUnit, count: values.intervalCount });
  if (!first) return `Paquete de cada ${every}`;
  return values.items.length > 1 ? `${first} y más cada ${every}` : `${first} cada ${every}`;
}
