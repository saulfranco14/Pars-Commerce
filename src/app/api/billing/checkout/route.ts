/* eslint-disable @typescript-eslint/no-explicit-any -- billing migration is deployed before generated DB types. */
import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { requirePermission } from "@/lib/auth/requirePermission";
import { createBillingCheckout } from "@/features/billing/billingService";
import type { BillingPlanCode } from "@/features/billing/entitlements";

const PAID_PLANS = new Set<BillingPlanCode>(["operation", "growth", "scale"]);

export async function POST(request: Request) {
  const body = (await request.json()) as {
    tenant_id?: string;
    plan_code?: BillingPlanCode;
  };
  if (!body.tenant_id || !body.plan_code || !PAID_PLANS.has(body.plan_code)) {
    return NextResponse.json(
      { error: "Selecciona un plan de pago válido" },
      { status: 400 },
    );
  }
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user)
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const membership = await requirePermission(
    user.id,
    body.tenant_id,
    "settings.write",
  );
  if (!membership || membership.roleName !== "owner")
    return NextResponse.json(
      { error: "Solo el propietario puede cambiar la membresía" },
      { status: 403 },
    );
  try {
    const origin = new URL(request.url).origin;
    return NextResponse.json(
      await createBillingCheckout({
        admin: createAdminClient() as any,
        tenantId: body.tenant_id,
        planCode: body.plan_code,
        payerEmail: user.email ?? "",
        origin,
      }),
    );
  } catch (error) {
    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : "No pudimos iniciar el cobro",
      },
      { status: 500 },
    );
  }
}
