import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { requirePlatformAdmin } from "../_lib";

type MembershipRow = {
  user_id: string;
  tenant_id: string;
  status?: string;
  tenant: { name: string; slug: string } | { name: string; slug: string }[] | null;
  role: { name: string } | { name: string }[] | null;
};

function relationOne<T>(value: T | T[] | null): T | null {
  return Array.isArray(value) ? (value[0] ?? null) : value;
}

export async function GET(request: Request) {
  const gate = await requirePlatformAdmin();
  if ("error" in gate) return gate.error;

  const params = new URL(request.url).searchParams;
  const query = params.get("q")?.trim().toLowerCase() ?? "";
  const status = params.get("status") ?? "all";
  const page = Math.max(Number(params.get("page") ?? 1) || 1, 1);
  const perPage = Math.min(Math.max(Number(params.get("per_page") ?? 10) || 10, 5), 25);
  const admin = createAdminClient();
  const { data, error } = await admin.auth.admin.listUsers({ page: 1, perPage: 1000 });

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  const ids = data.users.map((user) => user.id);
  const [profilesResult, membershipsResult, platformAdminsResult] = await Promise.all([
    ids.length
      ? admin
          .from("profiles")
          .select("id, display_name, email, phone, created_at, email_verification_status")
          .in("id", ids)
      : Promise.resolve({ data: [] }),
    ids.length
      ? admin
          .from("tenant_memberships")
          .select("user_id, tenant_id, status, tenant:tenants(name, slug), role:tenant_roles(name)")
          .in("user_id", ids)
      : Promise.resolve({ data: [] }),
    ids.length
      ? admin.from("platform_admins").select("user_id").in("user_id", ids)
      : Promise.resolve({ data: [] }),
  ]);

  const profileById = new Map((profilesResult.data ?? []).map((profile) => [profile.id, profile]));
  const membershipsByUser = new Map<string, MembershipRow[]>();
  for (const membership of (membershipsResult.data ?? []) as unknown as MembershipRow[]) {
    membershipsByUser.set(membership.user_id, [
      ...(membershipsByUser.get(membership.user_id) ?? []),
      membership,
    ]);
  }
  const platformAdminIds = new Set(
    (platformAdminsResult.data ?? []).map((item) => item.user_id),
  );
  const now = Date.now();

  const allUsers = data.users.map((authUser) => {
    const profile = profileById.get(authUser.id);
    const memberships = membershipsByUser.get(authUser.id) ?? [];
    const bannedUntil = authUser.banned_until ?? null;
    const isSuspended = Boolean(bannedUntil && new Date(bannedUntil).getTime() > now);
    const accountStatus = isSuspended
      ? "suspended"
      : profile?.email_verification_status === "pending"
        ? "pending"
        : "active";

    return {
      id: authUser.id,
      email: authUser.email ?? profile?.email ?? "",
      display_name: profile?.display_name ?? authUser.user_metadata?.display_name ?? "",
      phone: profile?.phone ?? null,
      email_confirmed_at: authUser.email_confirmed_at ?? null,
      last_sign_in_at: authUser.last_sign_in_at ?? null,
      created_at: authUser.created_at ?? profile?.created_at ?? null,
      banned_until: isSuspended ? bannedUntil : null,
      status: accountStatus,
      is_self: authUser.id === gate.user.id,
      is_platform_admin: platformAdminIds.has(authUser.id),
      businesses: memberships.length,
      active_businesses: memberships.filter(
        (membership) => membership.status !== "suspended" && membership.status !== "invited",
      ).length,
      memberships: memberships.map((membership) => ({
        tenant_id: membership.tenant_id,
        status: membership.status ?? "active",
        tenant: relationOne(membership.tenant),
        role: relationOne(membership.role)?.name ?? "member",
      })),
    };
  });

  const stats = {
    total: allUsers.length,
    active: allUsers.filter((user) => user.status === "active").length,
    pending: allUsers.filter((user) => user.status === "pending").length,
    suspended: allUsers.filter((user) => user.status === "suspended").length,
  };
  const filtered = allUsers.filter((user) => {
    const matchesQuery =
      !query ||
      `${user.email} ${user.display_name} ${user.phone ?? ""}`.toLowerCase().includes(query);
    return matchesQuery && (status === "all" || user.status === status);
  });
  const offset = (page - 1) * perPage;

  return NextResponse.json({
    users: filtered.slice(offset, offset + perPage),
    total: filtered.length,
    page,
    per_page: perPage,
    total_pages: Math.max(Math.ceil(filtered.length / perPage), 1),
    stats,
  });
}
