import "server-only";
import { createClient } from "@/lib/supabase/server";
import { studioDb } from "./studioDb";
import { StudioError, requireStudioData } from "./studioErrors";
import { studioFlags } from "./studioFlags";
import { isStudioMembershipActive } from "../helpers/access";
import type { StudioMembership, StudioPermission } from "../interfaces/studio";

export async function requireStudioAccess(
  tenantId: string,
  permission: StudioPermission = "studio.read",
  write = false,
) {
  const client = await createClient();
  const {
    data: { user },
  } = await client.auth.getUser();
  if (!user) throw new StudioError("UNAUTHORIZED");
  const db = studioDb();
  const allowed = requireStudioData(
    await db.rpc("studio_has_permission", {
      p_tenant_id: tenantId,
      p_actor_id: user.id,
      p_permission: permission,
    }),
  );
  if (!allowed) throw new StudioError("FORBIDDEN");
  const { data: membership, error } = await db
    .from("tenant_studio_subscriptions")
    .select(
      "id,tenant_id,plan_code,status,current_period_start,current_period_end,cancel_at_period_end,pending_plan_code,pending_amount_mxn,contracted_amount_mxn,plan_change_status,ai_blocked",
    )
    .eq("tenant_id", tenantId)
    .maybeSingle();
  if (error) throw new StudioError("NOT_CONFIGURED");
  if (write && !studioFlags().enabled) throw new StudioError("NOT_CONFIGURED");
  if (write && !isStudioMembershipActive(membership as StudioMembership | null))
    throw new StudioError("MEMBERSHIP_REQUIRED");
  const { data: tenantMembership } = await db
    .from("tenant_memberships")
    .select("role_id")
    .eq("tenant_id", tenantId)
    .eq("user_id", user.id)
    .single();
  const { data: role } = await db
    .from("tenant_roles")
    .select("name,permissions")
    .eq(
      "id",
      tenantMembership?.role_id ?? "00000000-0000-0000-0000-000000000000",
    )
    .single();
  return {
    db,
    user,
    tenantId,
    owner: role?.name === "owner",
    permissions: role?.permissions as string[] | null,
    membership: membership as StudioMembership | null,
  };
}

export async function requireStudioOwner(tenantId: string) {
  const access = await requireStudioAccess(tenantId, "studio.read");
  if (!access.owner)
    throw new StudioError(
      "FORBIDDEN",
      "Solo el propietario puede administrar la membresía Studio.",
    );
  return access;
}
