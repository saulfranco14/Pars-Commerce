/* eslint-disable @typescript-eslint/no-explicit-any -- billing migration is deployed before generated DB types. */
import { NextResponse } from "next/server";

import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { requirePermission } from "@/lib/auth/requirePermission";
import { createBillingCheckout } from "@/features/billing/billingService";
import type { BillingPlanCode } from "@/features/billing/entitlements";

/** Mercado Pago preapprovals are immutable once cancelled. To reactivate, the
 * owner authorizes a fresh mandate for the same tier; no prior charge is reused. */
export async function POST(request: Request) {
  const { tenant_id } = (await request.json()) as { tenant_id?: string };
  if (!tenant_id) return NextResponse.json({ error: "tenant_id es requerido" }, { status: 400 });
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const membership = await requirePermission(user.id, tenant_id, "settings.write");
  if (!membership || membership.roleName !== "owner") return NextResponse.json({ error: "Solo el propietario puede reactivar" }, { status: 403 });
  const admin = createAdminClient() as any;
  const { data: account } = await admin.from("tenant_billing_accounts").select("plan_code, status").eq("tenant_id", tenant_id).maybeSingle();
  if (!account?.plan_code || account.plan_code === "free" || account.status !== "cancelling") {
    return NextResponse.json({ error: "Elige tu plan nuevamente para reactivarlo" }, { status: 409 });
  }
  try {
    return NextResponse.json(await createBillingCheckout({
      admin,
      tenantId: tenant_id,
      planCode: account.plan_code as BillingPlanCode,
      payerEmail: user.email ?? "",
      origin: new URL(request.url).origin,
    }));
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : "No pudimos reactivar tu plan" }, { status: 500 });
  }
}
