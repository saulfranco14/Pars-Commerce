/* eslint-disable @typescript-eslint/no-explicit-any -- billing migration is deployed before generated DB types. */
import { NextResponse } from "next/server";

import { createAdminClient } from "@/lib/supabase/admin";
import { sendEmail } from "@/lib/email/sendgrid";

function isDue(
  frequency: "weekly" | "daily",
  lastSentAt: string | null,
  now: Date,
) {
  if (!lastSentAt) return true;
  const elapsed = now.getTime() - new Date(lastSentAt).getTime();
  return elapsed >= (frequency === "daily" ? 24 : 24 * 7) * 60 * 60 * 1000;
}

/** Sends an opt-in revenue summary. This endpoint is deliberately separate
 * from billing lifecycle so a temporary email failure never affects a plan. */
async function run(request: Request) {
  const secret = process.env.CRON_SECRET;
  if (!secret)
    return NextResponse.json(
      { error: "CRON_SECRET not configured" },
      { status: 503 },
    );
  const valid = request.headers.get("x-cron-secret") === secret || request.headers.get("authorization") === `Bearer ${secret}`;
  if (!valid)
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  const admin = createAdminClient() as any;
  const now = new Date();
  const { data: settings, error } = await admin
    .from("tenant_scheduled_reports")
    .select(
      "tenant_id, frequency, recipient_email, last_sent_at, tenant:tenants(name), account:tenant_billing_accounts(status, plan:billing_plans(entitlements))",
    )
    .eq("is_active", true);
  if (error)
    return NextResponse.json({ error: error.message }, { status: 500 });
  const result: Array<{
    tenant_id: string;
    outcome: "sent" | "not_due" | "not_entitled" | "error";
  }> = [];
  for (const setting of settings ?? []) {
    if (!isDue(setting.frequency, setting.last_sent_at, now)) {
      result.push({ tenant_id: setting.tenant_id, outcome: "not_due" });
      continue;
    }
    const account = Array.isArray(setting.account)
      ? setting.account[0]
      : setting.account;
    const plan = Array.isArray(account?.plan) ? account.plan[0] : account?.plan;
    if (
      account?.status !== "active" ||
      !plan?.entitlements?.scheduled_report_frequency
    ) {
      result.push({ tenant_id: setting.tenant_id, outcome: "not_entitled" });
      continue;
    }
    try {
      const since = new Date(now);
      since.setDate(since.getDate() - (setting.frequency === "daily" ? 1 : 7));
      const { data: orders, error: ordersError } = await admin
        .from("orders")
        .select("total")
        .eq("tenant_id", setting.tenant_id)
        .eq("status", "paid")
        .gte("paid_at", since.toISOString());
      if (ordersError) throw new Error(ordersError.message);
      const total = (orders ?? []).reduce(
        (sum: number, order: any) => sum + Number(order.total ?? 0),
        0,
      );
      const tenant = Array.isArray(setting.tenant)
        ? setting.tenant[0]
        : setting.tenant;
      const range = setting.frequency === "daily" ? "hoy" : "esta semana";
      await sendEmail({
        to: setting.recipient_email,
        subject: `Resumen ${range} · ${tenant?.name ?? "Tu negocio"}`,
        html: `<h2>Resumen de ${range}</h2><p><strong>${tenant?.name ?? "Tu negocio"}</strong> registró <strong>$${total.toFixed(2)}</strong> en ${orders?.length ?? 0} orden(es) pagada(s).</p><p>Consulta Tlaco para ver el detalle.</p>`,
      });
      await admin
        .from("tenant_scheduled_reports")
        .update({
          last_sent_at: now.toISOString(),
          updated_at: now.toISOString(),
        })
        .eq("tenant_id", setting.tenant_id);
      result.push({ tenant_id: setting.tenant_id, outcome: "sent" });
    } catch (sendError) {
      console.error("Scheduled report failed", setting.tenant_id, sendError);
      result.push({ tenant_id: setting.tenant_id, outcome: "error" });
    }
  }
  return NextResponse.json({
    ran_at: now.toISOString(),
    processed: result.length,
    result,
  });
}

export const GET = run;
export const POST = run;
