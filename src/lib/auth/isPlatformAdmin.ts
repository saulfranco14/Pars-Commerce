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

  try {
    const admin = createAdminClient();
    const { data, error } = await admin
      .from("platform_admins")
      .select("user_id")
      .eq("user_id", userId)
      .maybeSingle();

    if (error) {
      console.error("No se pudo verificar el rol de platform admin.", error);
      return false;
    }

    return !!data;
  } catch (error) {
    // This check only grants extra UI/permissions. Failing closed prevents a
    // missing service-role key or an unavailable table from breaking the
    // whole dashboard, while never granting platform access by mistake.
    console.error("No se pudo inicializar la verificación de platform admin.", error);
    return false;
  }
}
