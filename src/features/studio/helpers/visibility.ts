/** Presentation only. Tenant authorization and membership are always checked on the server. */
export function studioBusinessVisible(
  tenantId: string | null | undefined,
): boolean {
  if (process.env.NEXT_PUBLIC_STUDIO_BUSINESS_ENABLED === "true") return true;
  if (!tenantId) return false;
  return (process.env.NEXT_PUBLIC_STUDIO_PILOT_TENANT_IDS ?? "")
    .split(",")
    .map((id) => id.trim())
    .includes(tenantId);
}
