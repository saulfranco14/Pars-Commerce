export function buildOrdersKey(
  tenantId: string | undefined,
  status: string,
  dateFrom: string,
  dateTo: string
): string | null {
  if (!tenantId) return null;
  const search = new URLSearchParams({ tenant_id: tenantId });
  if (status) search.set("status", status);
  if (dateFrom) search.set("date_from", dateFrom);
  if (dateTo) search.set("date_to", dateTo);
  return `/api/orders?${search}`;
}
