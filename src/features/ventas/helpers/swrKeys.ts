export function buildCommissionsKey(
  tenantId: string,
  userFilter: string,
  paidFilter: string,
  dateFrom: string,
  dateTo: string
): string {
  const search = new URLSearchParams({ tenant_id: tenantId });
  if (userFilter) search.set("user_id", userFilter);
  if (paidFilter) search.set("is_paid", paidFilter);
  if (dateFrom) search.set("date_from", dateFrom);
  if (dateTo) search.set("date_to", dateTo);
  return `/api/sales-commissions?${search}`;
}

export function buildAnalyticsKey(
  tenantId: string,
  dateFrom: string,
  dateTo: string
): string | null {
  if (!tenantId) return null;
  const search = new URLSearchParams({ tenant_id: tenantId });
  if (dateFrom) search.set("date_from", dateFrom);
  if (dateTo) search.set("date_to", dateTo);
  return `/api/sales-analytics?${search}`;
}

export function buildPaymentsKey(
  tenantId: string,
  selectedUser: string,
  paymentStatus: string
): string {
  const search = new URLSearchParams({ tenant_id: tenantId });
  if (selectedUser) search.set("user_id", selectedUser);
  if (paymentStatus) search.set("status", paymentStatus);
  return `/api/commission-payments?${search}`;
}

export function buildCutoffsKey(tenantId: string): string {
  return `/api/sales-cutoffs?tenant_id=${encodeURIComponent(tenantId)}`;
}
