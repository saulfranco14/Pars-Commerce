/* eslint-disable @typescript-eslint/no-explicit-any -- billing migration is deployed before generated DB types. */
import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { requirePermission } from "@/lib/auth/requirePermission";
import {
  BillingCapabilityError,
  requireBillingCapability,
} from "@/features/billing/billingService";
import { getCreditRecommendation } from "@/features/billing/creditRecommendation";

export async function GET(request: Request) {
  const url = new URL(request.url);
  const tenantId = url.searchParams.get("tenant_id");
  const customerId = url.searchParams.get("customer_id");
  if (!tenantId || !customerId)
    return NextResponse.json(
      { error: "tenant_id y customer_id son requeridos" },
      { status: 400 },
    );
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user)
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (!(await requirePermission(user.id, tenantId, "settings.read")))
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  const admin = createAdminClient() as any;
  try {
    await requireBillingCapability(admin, tenantId, "credit_recommendation");
    return NextResponse.json(
      await getCreditRecommendation(admin, tenantId, customerId),
    );
  } catch (error) {
    if (error instanceof BillingCapabilityError)
      return NextResponse.json(
        {
          error:
            "La recomendación de préstamo está disponible desde Operación.",
          code: "billing_credit_recommendation",
          billing: error.account,
        },
        { status: 403 },
      );
    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : "No pudimos calcular la recomendación",
      },
      { status: 500 },
    );
  }
}
