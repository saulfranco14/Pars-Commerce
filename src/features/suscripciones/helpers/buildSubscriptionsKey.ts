export function buildSubscriptionsKey(
  tenantId: string | undefined,
  status: string,
  type: string,
): string | null {
  if (!tenantId) return null;
  const search = new URLSearchParams({ tenant_id: tenantId });
  if (status) search.set("status", status);
  if (type) search.set("type", type);
  return `/api/subscriptions?${search}`;
}
