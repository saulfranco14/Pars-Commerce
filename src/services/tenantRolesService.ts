import { apiFetch } from "@/services/apiFetch";

export interface TenantRoleOption {
  id: string;
  name: string;
}

export async function list(tenantId: string): Promise<TenantRoleOption[]> {
  const data = await apiFetch(
    `/api/tenant-roles?tenant_id=${encodeURIComponent(tenantId)}`
  );
  return Array.isArray(data) ? (data as TenantRoleOption[]) : [];
}
