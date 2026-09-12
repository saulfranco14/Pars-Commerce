import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { requirePermission } from "@/lib/auth/requirePermission";
import { isPlatformAdmin } from "@/lib/auth/isPlatformAdmin";
import { NextResponse } from "next/server";

/**
 * GET /api/ledger — the unified payment ledger (S1 settlement).
 *
 * Two audiences (auth → scope):
 *  - PLATFORM super admin: sees ALL tenants. Optionally filters by ?tenant_id.
 *  - Tenant OWNER: sees only their own tenant. `tenant_id` is required and must
 *    be one they own.
 *
 * Query: ?tenant_id&from&to&method. Returns the rows plus a summary aggregated
 * by payment_method (the "$X efectivo, $Y MP, N movimientos" the business wants)
 * and the platform-custodied total (what we owe them from MP).
 */
export async function GET(request: Request) {
  const supabase = await createClient();
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const tenantId = searchParams.get("tenant_id");
  const from = searchParams.get("from");
  const to = searchParams.get("to");
  const method = searchParams.get("method");

  const platformAdmin = await isPlatformAdmin(user.id);

  // Scope enforcement: a non-admin MUST pass a tenant_id they own.
  if (!platformAdmin) {
    if (!tenantId) {
      return NextResponse.json(
        { error: "tenant_id is required" },
        { status: 400 },
      );
    }
    const allowed = await requirePermission(user.id, tenantId, "settings.read");
    if (!allowed) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }
  }

  // Read the ledger with the admin client. RLS on the underlying tables would
  // otherwise block cross-tenant reads for the platform admin; the scope is
  // enforced above in application code (admin = all, owner = own tenant only).
  const admin = createAdminClient();
  let query = admin
    .from("payment_ledger")
    .select(
      "source_table, source_id, tenant_id, order_id, amount_gross, fee_amount, net_amount, provider, payment_method, is_platform_custodied, external_id, status, kind, created_at",
    )
    .order("created_at", { ascending: false });

  if (tenantId) query = query.eq("tenant_id", tenantId);
  if (from) query = query.gte("created_at", from);
  if (to) query = query.lte("created_at", to);
  if (method) query = query.eq("payment_method", method);

  const { data: rows, error } = await query;
  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  const ledger = rows ?? [];

  // Aggregation the business asked for: total + count per method, plus the
  // platform-custodied total (MP money we hold and must settle to them).
  const byMethod: Record<string, { total: number; count: number }> = {};
  let custodiedTotal = 0;
  let custodiedNet = 0;
  for (const r of ledger) {
    const m = r.payment_method ?? "desconocido";
    byMethod[m] ??= { total: 0, count: 0 };
    byMethod[m].total += Number(r.amount_gross);
    byMethod[m].count += 1;
    if (r.is_platform_custodied) {
      custodiedTotal += Number(r.amount_gross);
      custodiedNet += Number(r.net_amount);
    }
  }

  return NextResponse.json({
    scope: platformAdmin ? "platform" : "tenant",
    count: ledger.length,
    summary: {
      by_method: byMethod,
      platform_custodied_gross: custodiedTotal,
      platform_custodied_net: custodiedNet,
    },
    rows: ledger,
  });
}
