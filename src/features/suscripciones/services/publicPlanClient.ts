import { apiFetch } from "@/services/apiFetch";

/** The customer, from their private /plan/{token} link. */
export async function setPlanRenewal(token: string, action: "cancel_period_end" | "resume"): Promise<void> {
  await apiFetch(`/api/public/plan/${encodeURIComponent(token)}`, { method: "POST", body: JSON.stringify({ action }) });
}
