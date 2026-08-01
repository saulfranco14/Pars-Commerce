import { apiFetch } from "@/services/apiFetch";

export interface TenantRoleOption {
  id: string;
  name: string;
  /** Permisos reales del rol. Fuente de la descripción que ve quien invita. */
  permissions: string[];
}

export async function list(tenantId: string): Promise<TenantRoleOption[]> {
  const data = await apiFetch(
    `/api/tenant-roles?tenant_id=${encodeURIComponent(tenantId)}`
  );
  return Array.isArray(data) ? (data as TenantRoleOption[]) : [];
}
