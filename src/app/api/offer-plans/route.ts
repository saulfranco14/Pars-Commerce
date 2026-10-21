import { NextResponse } from "next/server";

import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { requirePermission } from "@/lib/auth/requirePermission";

import { serviceErrorToResponse } from "@/features/qr/services/serviceErrorToResponse";
import { archivePlan, getPlanTenant, savePlan } from "@/features/planes/services/planAdminService";
import { listPlansWithCounts } from "@/features/planes/services/planQueryService";

import type { OfferPlanWriteInput } from "@/features/planes/interfaces/offerPlan";

async function currentUser() {
  const supabase = await createClient();
  const {
    data: { user },
    error,
  } = await supabase.auth.getUser();
  return { user: error ? null : user };
}

async function readJson<T>(request: Request): Promise<T | null> {
  try {
    return (await request.json()) as T;
  } catch {
    return null;
  }
}

export async function GET(request: Request) {
  const { user } = await currentUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { searchParams } = new URL(request.url);
  const admin = createAdminClient();
  const planId = searchParams.get("plan_id");
  const tenantId = planId ? await getPlanTenant(admin, planId) : searchParams.get("tenant_id");
  if (!tenantId) return NextResponse.json({ error: planId ? "Plan not found" : "tenant_id is required" }, { status: planId ? 404 : 400 });
  if (!(await requirePermission(user.id, tenantId, "promotions.read"))) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const result = await listPlansWithCounts(admin, {
    tenantId,
    planId,
    includeArchived: searchParams.get("include_archived") === "true",
  });
  if (!result.ok) return serviceErrorToResponse(result.error);
  if (planId) return result.data[0] ? NextResponse.json(result.data[0]) : NextResponse.json({ error: "Plan not found" }, { status: 404 });
  return NextResponse.json(result.data);
}

export async function POST(request: Request) {
  const { user } = await currentUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await readJson<OfferPlanWriteInput & { tenant_id?: string }>(request);
  if (!body) return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  if (!body.tenant_id) return NextResponse.json({ error: "tenant_id is required" }, { status: 400 });
  if (!(await requirePermission(user.id, body.tenant_id, "promotions.write"))) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { tenant_id: tenantId, ...input } = body;
  const result = await savePlan(createAdminClient(), { tenantId, input });
  if (!result.ok) return serviceErrorToResponse(result.error);
  return NextResponse.json(result.data);
}

export async function PATCH(request: Request) {
  const { user } = await currentUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await readJson<OfferPlanWriteInput & { plan_id?: string }>(request);
  if (!body) return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  if (!body.plan_id) return NextResponse.json({ error: "plan_id is required" }, { status: 400 });

  const admin = createAdminClient();
  const tenantId = await getPlanTenant(admin, body.plan_id);
  if (!tenantId) return NextResponse.json({ error: "Plan not found" }, { status: 404 });
  if (!(await requirePermission(user.id, tenantId, "promotions.write"))) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { plan_id: planId, ...input } = body;
  const result = await savePlan(admin, { tenantId, planId, input });
  if (!result.ok) return serviceErrorToResponse(result.error);
  return NextResponse.json(result.data);
}

/** Archives instead of deleting so people already subscribed keep their plan. */
export async function DELETE(request: Request) {
  const { user } = await currentUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const planId = new URL(request.url).searchParams.get("plan_id");
  if (!planId) return NextResponse.json({ error: "plan_id is required" }, { status: 400 });

  const admin = createAdminClient();
  const tenantId = await getPlanTenant(admin, planId);
  if (!tenantId) return NextResponse.json({ error: "Plan not found" }, { status: 404 });
  if (!(await requirePermission(user.id, tenantId, "promotions.write"))) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const result = await archivePlan(admin, { tenantId, planId });
  if (!result.ok) return serviceErrorToResponse(result.error);
  return NextResponse.json({ success: true });
}
