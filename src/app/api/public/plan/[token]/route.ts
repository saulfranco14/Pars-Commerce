import { NextResponse } from "next/server";

import { createAdminClient } from "@/lib/supabase/admin";

import { serviceErrorToResponse } from "@/features/qr/services/serviceErrorToResponse";
import {
  cancelPlanSubscription,
  getPlanSubscriptionTenantByToken,
  resumePlanSubscription,
} from "@/features/suscripciones/services/planSubscriptionService";

// POST { action: "cancel_period_end" | "resume" } — the customer, holding the private link.
export async function POST(request: Request, { params }: { params: Promise<{ token: string }> }) {
  const { token } = await params;
  let body: { action?: string };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }
  if (body.action !== "cancel_period_end" && body.action !== "resume") {
    return NextResponse.json({ error: "Acción no válida." }, { status: 400 });
  }

  const admin = createAdminClient();
  const found = await getPlanSubscriptionTenantByToken(admin, token);
  if (!found) return NextResponse.json({ error: "No encontramos esta suscripción." }, { status: 404 });

  const ids = { tenantId: found.tenant_id, subscriptionId: found.id };
  const result =
    body.action === "resume"
      ? await resumePlanSubscription(admin, ids)
      : await cancelPlanSubscription(admin, { ...ids, when: "period_end" });
  if (!result.ok) return serviceErrorToResponse(result.error);
  return NextResponse.json({ success: true });
}
