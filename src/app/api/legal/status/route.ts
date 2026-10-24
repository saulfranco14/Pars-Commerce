import { NextResponse } from "next/server";

import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { asLegalAdmin, hasTenantLegalAcceptance } from "@/features/legal/legalActivation";

export async function GET(request: Request) {
  const session = await createClient();
  const { data: { user } } = await session.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const requestedTenantId = new URL(request.url).searchParams.get("tenant_id");
  const admin = asLegalAdmin(createAdminClient());
  let memberships = admin
    .from("tenant_memberships")
    .select("tenant_id, tenant:tenants(id, name, slug), role:tenant_roles(name)")
    .eq("user_id", user.id)
    .eq("status", "active");
  if (requestedTenantId) memberships = memberships.eq("tenant_id", requestedTenantId);
  const { data, error } = await memberships;
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  const states = await Promise.all((data ?? []).map(async (membership: any) => {
    const tenant = Array.isArray(membership.tenant) ? membership.tenant[0] : membership.tenant;
    const role = Array.isArray(membership.role) ? membership.role[0] : membership.role;
    const acceptance = await hasTenantLegalAcceptance(admin, membership.tenant_id);
    return { tenant_id: membership.tenant_id, tenant, role: role?.name ?? null, accepted: Boolean(acceptance), acceptance };
  }));
  const firstPending = states.find((state) => state.role === "owner" && !state.accepted) ?? null;
  const collaboratorPending = states.find((state) => state.role !== "owner" && !state.accepted) ?? null;
  return NextResponse.json({ pending: firstPending, collaborator_pending: collaboratorPending, states, email_verification: "pending_later" });
}
