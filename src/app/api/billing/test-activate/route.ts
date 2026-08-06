/* eslint-disable @typescript-eslint/no-explicit-any -- billing tables are deployed by migration. */
import { NextResponse } from "next/server";

import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { isPlatformAdmin } from "@/lib/auth/isPlatformAdmin";
import { logBillingActivity } from "@/features/billing/billingService";
import type { BillingPlanCode } from "@/features/billing/entitlements";

const PAID_PLANS = new Set<BillingPlanCode>(["operation", "growth", "scale"]);

/**
 * Local/staging-only entitlement test. It deliberately creates no Mercado Pago
 * authorization and is unavailable in production, so it can never be used as
 * a way to obtain a paid plan without a verified payment.
 */
export async function POST(request: Request) {
  if (process.env.NODE_ENV === "production" || process.env.BILLING_TEST_MODE !== "true") {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const body = (await request.json()) as {
    tenant_id?: string;
    plan_code?: BillingPlanCode;
  };
  if (!body.tenant_id || !body.plan_code || !PAID_PLANS.has(body.plan_code)) {
    return NextResponse.json({ error: "Plan de prueba inválido" }, { status: 400 });
  }

  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (!(await isPlatformAdmin(user.id))) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const admin = createAdminClient() as any;
  const { data: plan } = await admin
    .from("billing_plans")
    .select("code")
    .eq("code", body.plan_code)
    .eq("is_active", true)
    .maybeSingle();
  if (!plan) return NextResponse.json({ error: "Plan no disponible" }, { status: 404 });

  const start = new Date();
  const end = new Date(start);
  end.setMonth(end.getMonth() + 1);
  const { error } = await admin.from("tenant_billing_accounts").upsert({
    tenant_id: body.tenant_id,
    plan_code: body.plan_code,
    status: "active",
    mp_preapproval_id: null,
    mp_init_point: null,
    current_period_start: start.toISOString(),
    current_period_end: end.toISOString(),
    cancel_at_period_end: false,
    grace_ends_at: null,
    updated_at: start.toISOString(),
  });
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  await logBillingActivity(admin, body.tenant_id, "platform_admin", user.id, "billing.test_plan_activated", {
    plan_code: body.plan_code,
    test_mode: true,
    expires_at: end.toISOString(),
  });
  return NextResponse.json({ success: true, expires_at: end.toISOString() });
}
