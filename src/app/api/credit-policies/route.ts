/* eslint-disable @typescript-eslint/no-explicit-any -- billing migration is deployed before generated DB types. */
import { NextResponse } from "next/server";

import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { requirePermission } from "@/lib/auth/requirePermission";
import {
  BillingCapabilityError,
  requireBillingCapability,
} from "@/features/billing/billingService";

export async function PUT(request: Request) {
  const {
    tenant_id,
    min_paid_last_90_days,
    max_recommendation_percent,
    block_overdue_loans,
  } = (await request.json()) as Record<string, unknown>;
  if (typeof tenant_id !== "string")
    return NextResponse.json(
      { error: "tenant_id es requerido" },
      { status: 400 },
    );
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user)
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const membership = await requirePermission(
    user.id,
    tenant_id,
    "settings.write",
  );
  if (!membership || membership.roleName !== "owner")
    return NextResponse.json(
      { error: "Solo el propietario puede configurar reglas" },
      { status: 403 },
    );
  const admin = createAdminClient() as any;
  try {
    await requireBillingCapability(admin, tenant_id, "credit_policy_editor");
    const { error } = await admin.from("tenant_credit_policies").upsert({
      tenant_id,
      min_paid_last_90_days: Number(min_paid_last_90_days ?? 0),
      max_recommendation_percent: Number(max_recommendation_percent ?? 30),
      block_overdue_loans: Boolean(block_overdue_loans ?? true),
      updated_at: new Date().toISOString(),
    });
    if (error) throw new Error(error.message);
    return NextResponse.json({
      success: true,
      note: "La recomendación sigue siendo orientativa; ningún préstamo se aprueba automáticamente.",
    });
  } catch (error) {
    if (error instanceof BillingCapabilityError)
      return NextResponse.json(
        {
          error: "Las reglas de crédito están disponibles en Escala.",
          code: "billing_credit_policy",
          billing: error.account,
        },
        { status: 403 },
      );
    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : "No pudimos guardar las reglas",
      },
      { status: 500 },
    );
  }
}
