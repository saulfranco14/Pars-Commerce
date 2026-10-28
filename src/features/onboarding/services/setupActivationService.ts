import { apiFetch } from "@/services/apiFetch";

export type SetupActivationResult = { status: "legal_pending" } | { status: "activated"; slug: string };

/** Last step of setup: confirms the legal opening, marks the preview done and opens orders. */
export async function activateSetup(tenantId: string): Promise<SetupActivationResult> {
  const legal = (await apiFetch(`/api/legal/status?tenant_id=${encodeURIComponent(tenantId)}`, { cache: "no-store" }).catch(() => null)) as
    | { pending?: { tenant_id?: string } | null }
    | null;
  if (legal?.pending?.tenant_id === tenantId) return { status: "legal_pending" };
  await apiFetch("/api/tenants", {
    method: "PATCH",
    body: JSON.stringify({ tenant_id: tenantId, settings: { onboarding: { customer_preview_completed: true } } }),
  });
  const result = (await apiFetch("/api/tenants/complete-setup", { method: "POST", body: JSON.stringify({ tenant_id: tenantId }) })) as { slug: string };
  return { status: "activated", slug: result.slug };
}

export function legalOpeningUrl(tenantId: string): string {
  return `/dashboard/legal?tenant=${encodeURIComponent(tenantId)}&return=${encodeURIComponent(`/dashboard/preparar-negocio?tenant=${tenantId}&resume=activate`)}`;
}
