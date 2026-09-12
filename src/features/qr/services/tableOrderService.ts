import { apiFetch } from "@/services/apiFetch";

export async function resolveQrSession(token: string, fingerprintId?: string) {
  const headers: HeadersInit = {};
  if (fingerprintId) headers["x-fingerprint-id"] = fingerprintId;
  return apiFetch(`/api/qr/resolve?token=${encodeURIComponent(token)}`, {
    headers,
  });
}

export async function addTableItems(payload: {
  order_id: string;
  qr_token: string;
  items: Array<{
    product_id: string;
    quantity: number;
    is_shared?: boolean;
  }>;
  fingerprint_id?: string;
}) {
  const headers: HeadersInit = {};
  if (payload.fingerprint_id) headers["x-fingerprint-id"] = payload.fingerprint_id;
  return apiFetch("/api/qr/table/items", {
    method: "POST",
    headers,
    body: JSON.stringify(payload),
  });
}
