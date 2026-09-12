export function buildPaymentMethodKey(tenantId: string | null): string | null {
  if (!tenantId) return null;
  return `/api/tenant-payment-methods?tenant_id=${encodeURIComponent(tenantId)}`;
}
