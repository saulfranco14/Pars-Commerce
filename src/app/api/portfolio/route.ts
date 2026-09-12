/* eslint-disable @typescript-eslint/no-explicit-any -- billing migration is deployed before generated DB types. */
import { NextResponse } from "next/server";

import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { requirePermission } from "@/lib/auth/requirePermission";
import { BillingCapabilityError, requireBillingCapability } from "@/features/billing/billingService";

/** Consolidates only businesses owned by the authenticated person. The plan of
 * the current business determines how many other owned businesses can appear. */
export async function GET(request: Request) {
  const tenantId = new URL(request.url).searchParams.get("tenant_id");
  if (!tenantId) return NextResponse.json({ error: "tenant_id es requerido" }, { status: 400 });
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const membership = await requirePermission(user.id, tenantId, "settings.read");
  if (!membership || membership.roleName !== "owner") return NextResponse.json({ error: "Solo el propietario puede ver negocios consolidados" }, { status: 403 });
  const admin = createAdminClient() as any;
  try {
    const account = await requireBillingCapability(admin, tenantId, "portfolio_dashboard_limit");
    const { data: memberships, error } = await admin
      .from("tenant_memberships")
      .select("tenant_id, role:tenant_roles(name), tenant:tenants(id, name, slug)")
      .eq("user_id", user.id);
    if (error) throw new Error(error.message);
    const owned = (memberships ?? []).filter((item: any) => (Array.isArray(item.role) ? item.role[0]?.name : item.role?.name) === "owner");
    const visible = owned.slice(0, account.plan.entitlements.portfolio_dashboard_limit);
    const ids = visible.map((item: any) => item.tenant_id);
    const { data: orders, error: ordersError } = ids.length
      ? await admin.from("orders").select("tenant_id, total").in("tenant_id", ids).eq("status", "paid")
      : { data: [], error: null };
    if (ordersError) throw new Error(ordersError.message);
    const sales = new Map<string, number>();
    for (const order of orders ?? []) sales.set(order.tenant_id, (sales.get(order.tenant_id) ?? 0) + Number(order.total ?? 0));
    return NextResponse.json({
      limit: account.plan.entitlements.portfolio_dashboard_limit,
      total_owned: owned.length,
      businesses: visible.map((item: any) => {
        const tenant = Array.isArray(item.tenant) ? item.tenant[0] : item.tenant;
        return { id: item.tenant_id, name: tenant?.name ?? "Negocio", slug: tenant?.slug ?? null, paid_sales: sales.get(item.tenant_id) ?? 0 };
      }),
    });
  } catch (error) {
    if (error instanceof BillingCapabilityError) return NextResponse.json({ error: "El panel consolidado está disponible desde Crecimiento.", code: "billing_portfolio", billing: error.account }, { status: 403 });
    return NextResponse.json({ error: error instanceof Error ? error.message : "No pudimos cargar el consolidado" }, { status: 500 });
  }
}
