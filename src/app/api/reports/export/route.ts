/* eslint-disable @typescript-eslint/no-explicit-any -- billing migration is deployed before generated DB types. */
import { NextResponse } from "next/server";

import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { requirePermission } from "@/lib/auth/requirePermission";
import { BillingCapabilityError, requireBillingCapability } from "@/features/billing/billingService";

function csvCell(value: unknown) {
  const string = String(value ?? "");
  return `"${string.replaceAll('"', '""')}"`;
}

/** Exports completed sales only; no customer PII is sent to the browser. */
export async function POST(request: Request) {
  const { tenant_id, date_from, date_to } = await request.json() as { tenant_id?: string; date_from?: string; date_to?: string };
  if (!tenant_id) return NextResponse.json({ error: "tenant_id es requerido" }, { status: 400 });
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (!(await requirePermission(user.id, tenant_id, "orders.read"))) return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  const admin = createAdminClient() as any;
  try {
    await requireBillingCapability(admin, tenant_id, "export_reports");
    let query = admin.from("orders").select("order_number, total, paid_total, payment_method, paid_at, created_at").eq("tenant_id", tenant_id).eq("status", "paid").order("paid_at", { ascending: false });
    if (date_from) query = query.gte("paid_at", date_from);
    if (date_to) query = query.lte("paid_at", date_to);
    const { data, error } = await query;
    if (error) throw new Error(error.message);
    const rows = [
      ["Orden", "Total", "Cobrado", "Método", "Pagada", "Creada"],
      ...(data ?? []).map((order: any) => [order.order_number, order.total, order.paid_total, order.payment_method, order.paid_at, order.created_at]),
    ];
    const csv = rows.map((row) => row.map(csvCell).join(",")).join("\n");
    return new NextResponse(csv, { headers: { "Content-Type": "text/csv; charset=utf-8", "Content-Disposition": "attachment; filename=ventas-tlaco.csv" } });
  } catch (error) {
    if (error instanceof BillingCapabilityError) return NextResponse.json({ error: "La exportación de reportes está disponible desde Crecimiento.", code: "billing_export_reports", billing: error.account }, { status: 403 });
    return NextResponse.json({ error: error instanceof Error ? error.message : "No pudimos exportar el reporte" }, { status: 500 });
  }
}
