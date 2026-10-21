import { apiFetch } from "@/services/apiFetch";

import type { OfferPlan, OfferPlanWriteInput } from "@/features/planes/interfaces/offerPlan";

export function plansListKey(tenantId: string): string {
  return `/api/offer-plans?tenant_id=${encodeURIComponent(tenantId)}`;
}

export async function getPlan(planId: string): Promise<OfferPlan> {
  return (await apiFetch(`/api/offer-plans?plan_id=${encodeURIComponent(planId)}`)) as OfferPlan;
}

export async function createPlan(input: OfferPlanWriteInput & { tenant_id: string }): Promise<{ id: string }> {
  return (await apiFetch("/api/offer-plans", { method: "POST", body: JSON.stringify(input) })) as { id: string };
}

export async function updatePlan(planId: string, input: OfferPlanWriteInput): Promise<{ id: string }> {
  return (await apiFetch("/api/offer-plans", { method: "PATCH", body: JSON.stringify({ ...input, plan_id: planId }) })) as { id: string };
}

export async function archivePlan(planId: string): Promise<void> {
  await apiFetch(`/api/offer-plans?plan_id=${encodeURIComponent(planId)}`, { method: "DELETE" });
}
