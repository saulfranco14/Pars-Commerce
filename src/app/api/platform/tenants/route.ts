import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { requirePlatformAdmin } from "../_lib";

type MembershipRow = {
  tenant_id: string;
  user_id: string;
  status?: string;
  role: { name: string } | { name: string }[] | null;
};

function relationName(value: MembershipRow["role"]): string {
  const role = Array.isArray(value) ? value[0] : value;
  return role?.name ?? "member";
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
  const { data: tenants, error } = await admin
    .from("tenants")
    .select(
      "id, name, slug, business_type, description, logo_url, public_store_enabled, accepting_orders, whatsapp_phone, created_at, updated_at",
    )
    .order("updated_at", { ascending: false })
    .limit(500);

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  const ids = (tenants ?? []).map((tenant) => tenant.id);
  const thirtyDaysAgo = new Date(Date.now() - 30 * 86400000).toISOString();
  const [membershipsResult, tablesResult, ordersResult, addressesResult, billingResult] =
    await Promise.all([
      ids.length
        ? admin
            .from("tenant_memberships")
            .select("tenant_id, user_id, status, role:tenant_roles(name)")
            .in("tenant_id", ids)
        : Promise.resolve({ data: [] }),
      ids.length
        ? admin
            .from("qr_codes")
            .select("tenant_id, current_order_id")
            .eq("kind", "table")
            .eq("is_active", true)
            .is("archived_at", null)
            .in("tenant_id", ids)
        : Promise.resolve({ data: [] }),
      ids.length
        ? admin
            .from("orders")
            .select("tenant_id, total, status, created_at, updated_at")
            .in("tenant_id", ids)
            .gte("created_at", thirtyDaysAgo)
        : Promise.resolve({ data: [] }),
      ids.length
        ? admin
            .from("tenant_addresses")
            .select("tenant_id, city, state, country, phone")
            .in("tenant_id", ids)
        : Promise.resolve({ data: [] }),
      ids.length
        ? admin
            .from("tenant_billing_accounts" as never)
            .select("tenant_id, plan_code, status, current_period_end")
            .in("tenant_id", ids)
        : Promise.resolve({ data: [] }),
    ]);

  const memberships = (membershipsResult.data ?? []) as unknown as MembershipRow[];
  const ownerIds = memberships
    .filter((membership) => relationName(membership.role) === "owner")
    .map((membership) => membership.user_id);
  const { data: ownerProfiles } = ownerIds.length
    ? await admin
        .from("profiles")
        .select("id, display_name, email, phone")
        .in("id", ownerIds)
    : { data: [] };
  const ownerById = new Map((ownerProfiles ?? []).map((profile) => [profile.id, profile]));
  const addressByTenant = new Map(
    ((addressesResult.data ?? []) as Array<{
      tenant_id: string;
      city: string | null;
      state: string | null;
      country: string | null;
      phone: string | null;
    }>).map((address) => [address.tenant_id, address]),
  );
  const billingByTenant = new Map(
    ((billingResult.data ?? []) as unknown as Array<{
      tenant_id: string;
      plan_code: string;
      status: string;
      current_period_end: string | null;
    }>).map((account) => [account.tenant_id, account]),
  );

  const allTenants = (tenants ?? []).map((tenant) => {
    const team = memberships.filter((membership) => membership.tenant_id === tenant.id);
    const ownerMembership = team.find((membership) => relationName(membership.role) === "owner");
    const owner = ownerMembership ? ownerById.get(ownerMembership.user_id) : null;
    const tenantTables = ((tablesResult.data ?? []) as Array<{
      tenant_id: string;
      current_order_id: string | null;
    }>).filter((table) => table.tenant_id === tenant.id);
    const recentOrders = ((ordersResult.data ?? []) as Array<{
      tenant_id: string;
      total: number | null;
      status: string;
      created_at: string;
      updated_at: string;
    }>).filter((order) => order.tenant_id === tenant.id);
    const lastOrderAt = recentOrders.reduce<string | null>(
      (latest, order) => (!latest || order.updated_at > latest ? order.updated_at : latest),
      null,
    );

    return {
      ...tenant,
      owner: owner
        ? { display_name: owner.display_name, email: owner.email, phone: owner.phone }
        : null,
      address: addressByTenant.get(tenant.id) ?? null,
      billing: billingByTenant.get(tenant.id) ?? {
        plan_code: "free",
        status: "free",
        current_period_end: null,
      },
      team_active: team.filter(
        (membership) => membership.status === "active" || !membership.status,
      ).length,
      team_invited: team.filter((membership) => membership.status === "invited").length,
      active_tables: tenantTables.filter((table) => table.current_order_id).length,
      tables_enabled: tenantTables.length,
      orders_30d: recentOrders.length,
      sales_30d: recentOrders
        .filter((order) => order.status === "paid" || order.status === "completed")
        .reduce((sum, order) => sum + Number(order.total ?? 0), 0),
      open_orders: recentOrders.filter(
        (order) => !["paid", "completed", "cancelled"].includes(order.status),
      ).length,
      last_order_at: lastOrderAt,
      can_open_dashboard: team.some(
        (membership) =>
          membership.user_id === gate.user.id &&
          membership.status !== "suspended" &&
          membership.status !== "invited",
      ),
    };
  });

  const stats = {
    total: allTenants.length,
    accepting_orders: allTenants.filter(
      (tenant) => tenant.public_store_enabled && tenant.accepting_orders,
    ).length,
    paused: allTenants.filter(
      (tenant) => tenant.public_store_enabled && !tenant.accepting_orders,
    ).length,
    store_off: allTenants.filter((tenant) => !tenant.public_store_enabled).length,
  };
  const filtered = allTenants.filter((tenant) => {
    const ownerText = tenant.owner
      ? `${tenant.owner.display_name ?? ""} ${tenant.owner.email ?? ""}`
      : "";
    const matchesQuery =
      !query ||
      `${tenant.name} ${tenant.slug} ${tenant.business_type ?? ""} ${ownerText}`
        .toLowerCase()
        .includes(query);
    const lifecycle = !tenant.public_store_enabled
      ? "store_off"
      : tenant.accepting_orders
        ? "accepting_orders"
        : "paused";
    return matchesQuery && (status === "all" || lifecycle === status);
  });
  const offset = (page - 1) * perPage;

  return NextResponse.json({
    tenants: filtered.slice(offset, offset + perPage),
    total: filtered.length,
    page,
    per_page: perPage,
    total_pages: Math.max(Math.ceil(filtered.length / perPage), 1),
    stats,
  });
}
