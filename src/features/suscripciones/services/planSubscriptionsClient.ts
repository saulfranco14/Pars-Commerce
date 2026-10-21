import { apiFetch } from "@/services/apiFetch";

export type PlanSubscriptionAction = "cancel_now" | "cancel_period_end" | "resume";

export function planSubscriptionsKey(tenantId: string): string {
  return `/api/plan-subscriptions?tenant_id=${encodeURIComponent(tenantId)}`;
}

export async function updatePlanSubscription(tenantId: string, subscriptionId: string, action: PlanSubscriptionAction): Promise<void> {
  await apiFetch("/api/plan-subscriptions", {
    method: "PATCH",
    body: JSON.stringify({ tenant_id: tenantId, subscription_id: subscriptionId, action }),
  });
}
