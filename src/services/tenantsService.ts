import { apiFetch } from "@/services/apiFetch";

export async function list(): Promise<unknown[]> {
  const data = await apiFetch("/api/tenants");
  return Array.isArray(data) ? data : [];
}

export async function create(payload: {
  name: string;
  slug: string;
  business_type?: string;
}): Promise<unknown> {
  const data = await apiFetch("/api/tenants", {
    method: "POST",
    body: JSON.stringify(payload),
  });
  return data;
}

export async function update(
  tenantId: string,
  payload: Record<string, unknown>
): Promise<unknown> {
  const data = await apiFetch("/api/tenants", {
    method: "PATCH",
    body: JSON.stringify({ tenant_id: tenantId, ...payload }),
  });
  return data;
}
