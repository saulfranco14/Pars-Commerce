import type { Subcatalog } from "@/types/subcatalogs";
import { apiFetch } from "@/services/apiFetch";

export async function listByTenant(tenantId: string): Promise<Subcatalog[]> {
  const data = await apiFetch(
    `/api/subcatalogs?tenant_id=${encodeURIComponent(tenantId)}`
  );
  return Array.isArray(data) ? (data as Subcatalog[]) : [];
}

export async function create(payload: {
  tenant_id: string;
  name: string;
}): Promise<Subcatalog> {
  const data = await apiFetch("/api/subcatalogs", {
    method: "POST",
    body: JSON.stringify(payload),
  });
  return data as Subcatalog;
}

export async function update(payload: {
  subcatalog_id: string;
  name: string;
}): Promise<Subcatalog> {
  const data = await apiFetch("/api/subcatalogs", {
    method: "PATCH",
    body: JSON.stringify(payload),
  });
  return data as Subcatalog;
}

export async function remove(subcatalogId: string): Promise<void> {
  await apiFetch(
    `/api/subcatalogs?subcatalog_id=${encodeURIComponent(subcatalogId)}`,
    { method: "DELETE" }
  );
}
