import { NextResponse } from "next/server";

import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { requirePermission } from "@/lib/auth/requirePermission";

import { serviceErrorToResponse } from "@/features/qr/services/serviceErrorToResponse";
import {
  cancelPlanSubscription,
  getPlanSubscription,
  listPlanSubscriptions,
  resumePlanSubscription,
} from "@/features/suscripciones/services/planSubscriptionService";

const ACTIONS = ["cancel_now", "cancel_period_end", "resume"] as const;
type Action = (typeof ACTIONS)[number];

async function currentUser() {
  const supabase = await createClient();
  const {
    data: { user },
    error,
  } = await supabase.auth.getUser();
  return error ? null : user;
}

// GET ?tenant_id= lists plan subscriptions; add &subscription_id= for one with its periods.
export async function GET(request: Request) {
  const user = await currentUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { searchParams } = new URL(request.url);
  const tenantId = searchParams.get("tenant_id");
  if (!tenantId) return NextResponse.json({ error: "tenant_id is required" }, { status: 400 });
  if (!(await requirePermission(user.id, tenantId, "sales.read"))) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const admin = createAdminClient();
  const subscriptionId = searchParams.get("subscription_id");
  const result = subscriptionId
    ? await getPlanSubscription(admin, { tenantId, subscriptionId })
    : await listPlanSubscriptions(admin, tenantId);
  if (!result.ok) return serviceErrorToResponse(result.error);
  return NextResponse.json(result.data);
}

export async function PATCH(request: Request) {
  const user = await currentUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  let body: { tenant_id?: string; subscription_id?: string; action?: string };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }
  const { tenant_id: tenantId, subscription_id: subscriptionId } = body;
  const action = body.action as Action;
  if (!tenantId || !subscriptionId || !ACTIONS.includes(action)) {
    return NextResponse.json({ error: "tenant_id, subscription_id y una acción válida son requeridos" }, { status: 400 });
  }
  if (!(await requirePermission(user.id, tenantId, "sales.write"))) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const admin = createAdminClient();
  const result =
    action === "resume"
      ? await resumePlanSubscription(admin, { tenantId, subscriptionId })
      : await cancelPlanSubscription(admin, { tenantId, subscriptionId, when: action === "cancel_now" ? "now" : "period_end" });
  if (!result.ok) return serviceErrorToResponse(result.error);
  return NextResponse.json({ success: true });
}
