import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { requirePermission } from "@/lib/auth/requirePermission";
import { isPlatformAdmin } from "@/lib/auth/isPlatformAdmin";
import { NextResponse } from "next/server";

/**
 * Feature interest ("me interesa" on Novedades).
 *
 * GET  — the tenant's registered interests (which upcoming features it wants).
 *        Owner sees their own; platform admin can query any tenant, or omit
 *        tenant_id to get the demand COUNT per feature across all tenants
 *        (the signal for prioritizing the roadmap).
 * POST — register interest in a feature (idempotent via UNIQUE). Owner only.
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
  const admin = createAdminClient();
  const platformAdmin = await isPlatformAdmin(user.id);

  // Platform admin, no tenant_id → aggregate demand per feature.
  if (platformAdmin && !tenantId) {
    const { data } = await admin
      .from("feature_interest")
      .select("feature_key");
    const counts: Record<string, number> = {};
    for (const r of data ?? []) {
      counts[r.feature_key] = (counts[r.feature_key] ?? 0) + 1;
    }
    return NextResponse.json({ demand: counts });
  }

  if (!tenantId) {
    return NextResponse.json({ error: "tenant_id is required" }, { status: 400 });
  }
  if (!platformAdmin) {
    const allowed = await requirePermission(user.id, tenantId, "settings.read");
    if (!allowed) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }
  }

  const { data } = await admin
    .from("feature_interest")
    .select("feature_key, created_at")
    .eq("tenant_id", tenantId);

  return NextResponse.json({
    interested: (data ?? []).map((r) => r.feature_key),
  });
}

export async function POST(request: Request) {
  const supabase = await createClient();
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();
  if (authError || !user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await request.json();
  const { tenant_id, feature_key } = body as {
    tenant_id?: string;
    feature_key?: string;
  };

  if (!tenant_id || !feature_key?.trim()) {
    return NextResponse.json(
      { error: "tenant_id y feature_key son requeridos" },
      { status: 400 },
    );
  }

  const allowed = await requirePermission(user.id, tenant_id, "settings.write");
  if (!allowed) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const admin = createAdminClient();
  const { error } = await admin.from("feature_interest").insert({
    tenant_id,
    feature_key: feature_key.trim(),
    created_by: user.id,
  });

  // 23505 = already interested → idempotent, treat as success.
  if (error && error.code !== "23505") {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ ok: true, feature_key: feature_key.trim() });
}
