import { createAdminClient } from "@/lib/supabase/admin";

export interface TenantPermissionResult {
  membershipId: string;
  roleId: string;
  roleName: string;
  permissions: string[];
}

export async function requirePermission(
  userId: string,
  tenantId: string,
  permission: string,
): Promise<TenantPermissionResult | null> {
  const admin = createAdminClient();
  const { data: membership } = await admin
    .from("tenant_memberships")
    .select("id, role_id")
    .eq("tenant_id", tenantId)
    .eq("user_id", userId)
    .single();

  if (!membership) return null;

  const { data: role } = await admin
    .from("tenant_roles")
    .select("name, permissions")
    .eq("id", membership.role_id)
    .single();

  if (!role) return null;

  const permissions = (role.permissions as string[] | null) ?? [];
  if (role.name === "owner" || permissions.includes(permission)) {
    return {
      membershipId: membership.id,
      roleId: membership.role_id,
      roleName: role.name,
      permissions,
    };
  }

  return null;
}
