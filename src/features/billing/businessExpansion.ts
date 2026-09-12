/* eslint-disable @typescript-eslint/no-explicit-any -- billing tables are introduced by the billing migration. */
import type { SupabaseClient } from "@supabase/supabase-js";

const BUSINESS_LIMITS = {
  free: 1,
  operation: 2,
  growth: 3,
  scale: 12,
} as const;

/** Server-side source of truth for creating another business. */
export async function getAdditionalBusinessAccess(
  adminClient: unknown,
  userId: string,
) {
  // `tenant_billing_accounts` is added by the billing migration and is not in
  // the checked-in generated Supabase types yet. Keep that compatibility
  // boundary inside this server-only module instead of leaking `any` to APIs.
  const admin = adminClient as SupabaseClient<any>;
  const { data: memberships, error: membershipError } = await admin
    .from("tenant_memberships")
    .select("tenant_id, role:tenant_roles(name)")
    .eq("user_id", userId)
    .eq("status", "active");
  if (membershipError) throw new Error(membershipError.message);

  const ownedTenantIds = (memberships ?? [])
    .filter((membership: any) => {
      const role = Array.isArray(membership.role)
        ? membership.role[0]
        : membership.role;
      return role?.name === "owner";
    })
    .map((membership: any) => membership.tenant_id as string);

  const { data: paidAccounts, error: billingError } = await admin
    .from("tenant_billing_accounts")
    .select("tenant_id, plan_code")
    .in("tenant_id", ownedTenantIds)
    .neq("plan_code", "free")
    .in("status", ["active", "cancelling"]);
  if (billingError) throw new Error(billingError.message);

  const planCode = ((paidAccounts ?? []).map((account: any) => account.plan_code)
    .sort((left: keyof typeof BUSINESS_LIMITS, right: keyof typeof BUSINESS_LIMITS) => BUSINESS_LIMITS[right] - BUSINESS_LIMITS[left])[0] ?? "free") as keyof typeof BUSINESS_LIMITS;
  const limit = BUSINESS_LIMITS[planCode] ?? BUSINESS_LIMITS.free;
  return {
    can_create: ownedTenantIds.length < limit,
    requires_upgrade: planCode === "free" && ownedTenantIds.length >= limit,
    plan_code: planCode,
    business_limit: limit,
    businesses_owned: ownedTenantIds.length,
  };
}
