export const teamKey = (tenantId: string) =>
  `/api/team?tenant_id=${encodeURIComponent(tenantId)}`;

export const tenantRolesKey = (tenantId: string) =>
  `/api/tenant-roles?tenant_id=${encodeURIComponent(tenantId)}`;
