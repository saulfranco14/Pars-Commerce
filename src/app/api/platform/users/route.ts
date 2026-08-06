import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { requirePlatformAdmin } from "../_lib";

export async function GET(request: Request) {
  const gate = await requirePlatformAdmin();
  if ("error" in gate) return gate.error;
  const query = new URL(request.url).searchParams.get("q")?.trim().toLowerCase() ?? "";
  const admin = createAdminClient();
  const { data, error } = await admin.auth.admin.listUsers({ page: 1, perPage: 200 });
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  const ids = data.users.map((u) => u.id);
  const { data: profiles } = ids.length ? await admin.from("profiles").select("id, display_name, email, phone, created_at").in("id", ids) : { data: [] };
  const { data: memberships } = ids.length ? await admin.from("tenant_memberships").select("user_id, tenant_id, status").in("user_id", ids) : { data: [] };
  const profileById = new Map((profiles ?? []).map((profile) => [profile.id, profile]));
  const membershipsByUser = new Map<string, Array<{ tenant_id: string; status?: string }>>();
  for (const item of (memberships ?? []) as unknown as Array<{ user_id: string; tenant_id: string; status?: string }>) {
    membershipsByUser.set(item.user_id, [...(membershipsByUser.get(item.user_id) ?? []), item]);
  }
  const users = data.users.map((authUser) => {
    const profile = profileById.get(authUser.id);
    const userMemberships = membershipsByUser.get(authUser.id) ?? [];
    return {
      id: authUser.id,
      email: authUser.email ?? profile?.email ?? "",
      display_name: profile?.display_name ?? authUser.user_metadata?.display_name ?? "",
      email_confirmed_at: authUser.email_confirmed_at ?? null,
      last_sign_in_at: authUser.last_sign_in_at ?? null,
      created_at: authUser.created_at,
      banned_until: authUser.banned_until ?? null,
      businesses: userMemberships.length,
      active_businesses: userMemberships.filter((m) => m.status !== "suspended" && m.status !== "invited").length,
    };
  }).filter((item) => !query || `${item.email} ${item.display_name}`.toLowerCase().includes(query));
  return NextResponse.json({ users, total: users.length });
}
