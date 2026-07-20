import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { requirePermission } from "@/lib/auth/requirePermission";
import { isPlatformAdmin } from "@/lib/auth/isPlatformAdmin";
import { NextResponse } from "next/server";

/**
 * GET /api/settlements — a tenant's settlements (S5, business side).
 *
 * The "when do I get my money?" view for the business: its settlements with
 * status + amount to transfer. Owner sees their own tenant; platform admin can
 * query any tenant (or all if no tenant_id).
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

  const tenantId = new URL(request.url).searchParams.get("tenant_id");
  const platformAdmin = await isPlatformAdmin(user.id);

  if (!platformAdmin) {
    if (!tenantId) {
      return NextResponse.json({ error: "tenant_id is required" }, { status: 400 });
    }
    const allowed = await requirePermission(user.id, tenantId, "settings.read");
    if (!allowed) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }
  }

  const admin = createAdminClient();
  let query = admin
    .from("settlements")
    .select(
      "id, tenant_id, cycle_type, period_start, period_end, gross_mp_amount, net_mp_amount, platform_commission, amount_to_transfer, status, transfer_reference, transfer_note, transfer_proof_url, transfer_confirmed_at, created_at",
    )
    .order("period_end", { ascending: false });

  if (tenantId) query = query.eq("tenant_id", tenantId);

  const { data, error } = await query;
  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  const settlements = data ?? [];
  // Quick summary the business cares about: how much is coming and how much
  // has been confirmed as received.
  let pending = 0;
  let confirmed = 0;
  for (const s of settlements) {
    if (s.status === "transfer_confirmed") confirmed += Number(s.amount_to_transfer);
    else pending += Number(s.amount_to_transfer);
  }

  return NextResponse.json({
    count: settlements.length,
    summary: {
      pending_to_receive: Math.round(pending * 100) / 100,
      confirmed_received: Math.round(confirmed * 100) / 100,
    },
    settlements,
  });
}
