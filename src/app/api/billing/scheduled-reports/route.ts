/* eslint-disable @typescript-eslint/no-explicit-any -- billing migration is deployed before generated DB types. */
import { NextResponse } from "next/server";

import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { requirePermission } from "@/lib/auth/requirePermission";
import {
  BillingCapabilityError,
  getBillingAccount,
} from "@/features/billing/billingService";

async function authorize(tenantId: string, write = false) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user)
    return {
      error: NextResponse.json({ error: "Unauthorized" }, { status: 401 }),
    };
  const membership = await requirePermission(
    user.id,
    tenantId,
    write ? "settings.write" : "settings.read",
  );
  if (!membership || (write && membership.roleName !== "owner")) {
    return {
      error: NextResponse.json(
        {
          error: write
            ? "Solo el propietario puede configurar reportes"
            : "Forbidden",
        },
        { status: 403 },
      ),
    };
  }
  const admin = createAdminClient() as any;
  const account = await getBillingAccount(admin, tenantId);
  if (!account.plan.entitlements.scheduled_report_frequency)
    throw new BillingCapabilityError(account, "scheduled_report_frequency");
  return { admin, account };
}

export async function GET(request: Request) {
  const tenantId = new URL(request.url).searchParams.get("tenant_id");
  if (!tenantId)
    return NextResponse.json(
      { error: "tenant_id es requerido" },
      { status: 400 },
    );
  try {
    const auth = await authorize(tenantId);
    if ("error" in auth) return auth.error;
    const { data, error } = await auth.admin
      .from("tenant_scheduled_reports")
      .select("frequency, recipient_email, is_active, last_sent_at")
      .eq("tenant_id", tenantId)
      .maybeSingle();
    if (error) throw new Error(error.message);
    return NextResponse.json({
      entitlement: auth.account.plan.entitlements.scheduled_report_frequency,
      report: data,
    });
  } catch (error) {
    if (error instanceof BillingCapabilityError)
      return NextResponse.json(
        {
          error:
            "Los reportes programados están disponibles desde Crecimiento.",
          code: "billing_scheduled_reports",
          billing: error.account,
        },
        { status: 403 },
      );
    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : "No pudimos cargar la configuración",
      },
      { status: 500 },
    );
  }
}

export async function PUT(request: Request) {
  const {
    tenant_id,
    frequency,
    recipient_email,
    is_active = true,
  } = (await request.json()) as {
    tenant_id?: string;
    frequency?: "weekly" | "daily";
    recipient_email?: string;
    is_active?: boolean;
  };
  if (!tenant_id || !frequency || !recipient_email)
    return NextResponse.json(
      { error: "tenant_id, frecuencia y correo son requeridos" },
      { status: 400 },
    );
  try {
    const auth = await authorize(tenant_id, true);
    if ("error" in auth) return auth.error;
    if (
      auth.account.plan.entitlements.scheduled_report_frequency === "weekly" &&
      frequency !== "weekly"
    ) {
      return NextResponse.json(
        {
          error:
            "Tu plan permite reportes semanales. Escala agrega la frecuencia diaria.",
        },
        { status: 403 },
      );
    }
    const { error } = await auth.admin.from("tenant_scheduled_reports").upsert({
      tenant_id,
      frequency,
      recipient_email: recipient_email.trim().toLowerCase(),
      is_active,
      updated_at: new Date().toISOString(),
    });
    if (error) throw new Error(error.message);
    return NextResponse.json({ success: true });
  } catch (error) {
    if (error instanceof BillingCapabilityError)
      return NextResponse.json(
        {
          error:
            "Los reportes programados están disponibles desde Crecimiento.",
          code: "billing_scheduled_reports",
          billing: error.account,
        },
        { status: 403 },
      );
    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : "No pudimos guardar la configuración",
      },
      { status: 500 },
    );
  }
}
