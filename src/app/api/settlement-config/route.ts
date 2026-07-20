import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { requirePermission } from "@/lib/auth/requirePermission";
import { isPlatformAdmin } from "@/lib/auth/isPlatformAdmin";
import { previewCycles } from "@/features/settlement/helpers/cyclePreview";
import {
  SETTLEMENT_CYCLES,
  type SettlementCycle,
} from "@/constants/platformCommission";
import { NextResponse } from "next/server";

/**
 * GET/PUT /api/settlement-config — a tenant's settlement cycle (S4).
 *
 * GET: the owner (or platform admin) sees the current config + a preview of
 * what every cycle would cost, so they can compare before choosing.
 * PUT: the owner changes their cycle_type (and custom_cycle_days). They CANNOT
 * set commission_override — that's platform-only (contract). Attempts to send
 * it are ignored.
 */
const SAMPLE_NET = 1000; // preview basis: "on $1000 net you'd receive..."

async function authTenant(userId: string, tenantId: string): Promise<boolean> {
  if (await isPlatformAdmin(userId)) return true;
  return !!(await requirePermission(userId, tenantId, "settings.write"));
}

export async function GET(request: Request) {
  const supabase = await createClient();
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();
  if (authError || !user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const tenantId = new URL(request.url).searchParams.get("tenant_id");
  if (!tenantId) {
    return NextResponse.json({ error: "tenant_id is required" }, { status: 400 });
  }
  if (!(await authTenant(user.id, tenantId))) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const admin = createAdminClient();
  const { data: config } = await admin
    .from("tenant_settlement_config")
    .select("tenant_id, cycle_type, custom_cycle_days, commission_override, last_settled_at")
    .eq("tenant_id", tenantId)
    .maybeSingle();

  return NextResponse.json({
    config: config ?? { tenant_id: tenantId, cycle_type: "weekly", custom_cycle_days: null, commission_override: null, last_settled_at: null },
    preview: previewCycles(SAMPLE_NET, config?.commission_override ?? undefined),
    preview_basis: SAMPLE_NET,
  });
}

export async function PUT(request: Request) {
  const supabase = await createClient();
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();
  if (authError || !user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await request.json();
  const { tenant_id, cycle_type, custom_cycle_days } = body as {
    tenant_id?: string;
    cycle_type?: string;
    custom_cycle_days?: number | null;
  };

  if (!tenant_id) {
    return NextResponse.json({ error: "tenant_id is required" }, { status: 400 });
  }
  if (!(await authTenant(user.id, tenant_id))) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  if (!cycle_type || !SETTLEMENT_CYCLES.includes(cycle_type as SettlementCycle)) {
    return NextResponse.json(
      { error: `cycle_type debe ser uno de: ${SETTLEMENT_CYCLES.join(", ")}` },
      { status: 400 },
    );
  }
  if (cycle_type === "custom" && (!custom_cycle_days || custom_cycle_days < 1)) {
    return NextResponse.json(
      { error: "El ciclo 'custom' requiere custom_cycle_days >= 1" },
      { status: 400 },
    );
  }

  // NOTE: commission_override is intentionally NOT read from the body — a
  // business can't set its own commission. Only cycle_type/custom_cycle_days.
  const admin = createAdminClient();
  const { data: updated, error } = await admin
    .from("tenant_settlement_config")
    .upsert(
      {
        tenant_id,
        cycle_type,
        custom_cycle_days: cycle_type === "custom" ? custom_cycle_days : null,
        updated_at: new Date().toISOString(),
      },
      { onConflict: "tenant_id" },
    )
    .select("tenant_id, cycle_type, custom_cycle_days, commission_override")
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ config: updated });
}
