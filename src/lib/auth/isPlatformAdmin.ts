import { createAdminClient } from "@/lib/supabase/admin";

/**
 * Whether a user is a PLATFORM super admin (cross-tenant access).
 *
 * Server-only: uses the admin client (service_role) to read `platform_admins`,
 * which normal users cannot read (RLS). Orthogonal to tenant roles — a platform
 * admin is above all tenants, not a member of one.
 *
 * Use this to gate cross-tenant endpoints (global ledger, all-tenant
 * settlements). NEVER import from a Client Component.
 */
export async function isPlatformAdmin(userId: string): Promise<boolean> {
  if (!userId) return false;
  const admin = createAdminClient();
  const { data } = await admin
    .from("platform_admins")
    .select("user_id")
    .eq("user_id", userId)
    .maybeSingle();
  return !!data;
}
