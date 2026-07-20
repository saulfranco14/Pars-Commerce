export const buildQrCodesKey = (tenantId: string | null, kind?: string | null) => {
  if (!tenantId) return null;
  const params = new URLSearchParams({ tenant_id: tenantId });
  if (kind) params.set("kind", kind);
  return `/api/qr/codes?${params.toString()}`;
};

export const buildQrResolveKey = (token: string | null) =>
  token ? `/api/qr/resolve?token=${encodeURIComponent(token)}` : null;
