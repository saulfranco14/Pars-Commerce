import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { requirePlatformAdmin } from "../_lib";

export async function GET() {
  const gate = await requirePlatformAdmin();
  if ("error" in gate) return gate.error;
  const admin = createAdminClient();
  const { data: tenants, error } = await admin.from("tenants").select("id, name, slug, accepting_orders, created_at, updated_at").order("updated_at", { ascending: false }).limit(200);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  const ids = (tenants ?? []).map((tenant) => tenant.id);
  const [memberships, tables, orders] = await Promise.all([
    ids.length ? admin.from("tenant_memberships").select("tenant_id, status").in("tenant_id", ids) : Promise.resolve({ data: [] }),
    ids.length ? admin.from("qr_codes").select("tenant_id, current_order_id").eq("kind", "table").eq("is_active", true).is("archived_at", null).in("tenant_id", ids) : Promise.resolve({ data: [] }),
    ids.length ? admin.from("orders").select("tenant_id, total, status, created_at").in("tenant_id", ids).gte("created_at", new Date(Date.now() - 30 * 86400000).toISOString()) : Promise.resolve({ data: [] }),
  ]);
  const response = (tenants ?? []).map((tenant) => {
    const team = ((memberships.data ?? []) as unknown as Array<{ tenant_id: string; status?: string }>).filter((m) => m.tenant_id === tenant.id);
    const tenantTables = ((tables.data ?? []) as Array<{ tenant_id: string; current_order_id: string | null }>).filter((item) => item.tenant_id === tenant.id);
    const recentOrders = ((orders.data ?? []) as Array<{ tenant_id: string; total: number | null; status: string }>).filter((item) => item.tenant_id === tenant.id);
    return {
      ...tenant,
      team_active: team.filter((m) => m.status === "active" || !m.status).length,
      team_invited: team.filter((m) => m.status === "invited").length,
      active_tables: tenantTables.filter((table) => table.current_order_id).length,
      tables_enabled: tenantTables.length,
      sales_30d: recentOrders.filter((order) => order.status === "paid").reduce((sum, order) => sum + Number(order.total ?? 0), 0),
      open_orders: recentOrders.filter((order) => !["paid", "cancelled"].includes(order.status)).length,
    };
  });
  return NextResponse.json({ tenants: response });
}
