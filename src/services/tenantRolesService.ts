import { apiFetch } from "@/services/apiFetch";

export interface TenantRoleOption {
  id: string;
  name: string;
  /** Permisos reales del rol. Fuente de la descripción y de la vista previa. */
  permissions: string[];
  /** Rol de Tlaco (sembrado para cada negocio); los propios del negocio son `false`. */
  is_system?: boolean;
}

export async function list(tenantId: string): Promise<TenantRoleOption[]> {
  const data = await apiFetch(
    `/api/tenant-roles?tenant_id=${encodeURIComponent(tenantId)}`
  );
  return Array.isArray(data) ? (data as TenantRoleOption[]) : [];
}

export async function create(tenantId: string, name: string, permissions: string[]): Promise<TenantRoleOption> {
  return (await apiFetch("/api/tenant-roles", {
    method: "POST",
    body: JSON.stringify({ tenant_id: tenantId, name, permissions }),
  })) as TenantRoleOption;
}

export async function update(
  tenantId: string,
  roleId: string,
  changes: { name?: string; permissions?: string[]; reset?: boolean },
): Promise<TenantRoleOption> {
  return (await apiFetch("/api/tenant-roles", {
    method: "PATCH",
    body: JSON.stringify({ tenant_id: tenantId, role_id: roleId, ...changes }),
  })) as TenantRoleOption;
}

export async function remove(tenantId: string, roleId: string): Promise<void> {
  await apiFetch(
    `/api/tenant-roles?tenant_id=${encodeURIComponent(tenantId)}&role_id=${encodeURIComponent(roleId)}`,
    { method: "DELETE" },
  );
}
