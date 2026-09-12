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
    .select("id, role_id, status, invitation_expires_at")
    .eq("tenant_id", tenantId)
    .eq("user_id", userId)
    .single();

  const lifecycle = membership as unknown as { id: string; role_id: string; status?: string; invitation_expires_at?: string | null } | null;
  if (!lifecycle || lifecycle.status === "suspended" || lifecycle.status === "invited") return null;
  if (lifecycle.invitation_expires_at && new Date(lifecycle.invitation_expires_at) < new Date()) return null;

  const { data: role } = await admin
    .from("tenant_roles")
    .select("name, permissions")
    .eq("id", lifecycle.role_id)
    .single();

  if (!role) return null;

  const permissions = (role.permissions as string[] | null) ?? [];
  if (role.name === "owner" || permissions.includes(permission)) {
    return {
      membershipId: lifecycle.id,
      roleId: lifecycle.role_id,
      roleName: role.name,
      permissions,
    };
  }

  return null;
}
