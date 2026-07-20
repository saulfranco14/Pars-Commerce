import { apiFetch } from "@/services/apiFetch";

import type { QrCode } from "@/features/qr/interfaces/qrCode";

export async function listQrCodes(
  tenantId: string,
  kind?: "payment" | "table",
): Promise<QrCode[]> {
  const params = new URLSearchParams({ tenant_id: tenantId });
  if (kind) params.set("kind", kind);
  return (await apiFetch(`/api/qr/codes?${params.toString()}`)) as QrCode[];
}

export async function createQrCode(payload: {
  tenant_id: string;
  kind: "payment" | "table";
  label: string;
  table_capacity?: number | null;
  preset_amount?: number | null;
  preset_concept?: string | null;
  allow_amount_override?: boolean;
}) {
  return (await apiFetch("/api/qr/codes", {
    method: "POST",
    body: JSON.stringify(payload),
  })) as QrCode;
}

export async function updateQrCode(payload: Record<string, unknown>) {
  return (await apiFetch("/api/qr/codes", {
    method: "PATCH",
    body: JSON.stringify(payload),
  })) as QrCode;
}

export async function archiveQrCode(tenantId: string, id: string) {
  return apiFetch(
    `/api/qr/codes?tenant_id=${encodeURIComponent(tenantId)}&id=${encodeURIComponent(id)}`,
    {
      method: "DELETE",
    },
  );
}
