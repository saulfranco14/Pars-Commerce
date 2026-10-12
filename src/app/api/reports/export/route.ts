import { NextResponse } from "next/server";
import ExcelJS from "exceljs";
import { PDFDocument, StandardFonts, rgb } from "pdf-lib";

import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { requirePermission } from "@/lib/auth/requirePermission";

type CommerceAdmin = { from: (table: string) => any };
type ExportBody = { tenant_id?: string; report_type?: "sales" | "commissions"; format?: "pdf" | "xlsx"; date_from?: string; date_to?: string; include_products?: boolean; include_services?: boolean };
type ExportOrder = { order_number: string | null; total: number | string; paid_total: number | string; payment_method: string | null; paid_at: string | null; created_at: string; customer_name: string | null; items?: { quantity: number; unit_price: number | string; subtotal: number | string; product?: { name?: string | null; type?: string | null } | null }[] };
const money = (value: number) => new Intl.NumberFormat("es-MX", { style: "currency", currency: "MXN" }).format(value);
const toDate = (date?: string) => date ? new Date(`${date}T00:00:00`).toISOString() : undefined;
const toEndDate = (date?: string) => date ? new Date(`${date}T23:59:59.999`).toISOString() : undefined;

export async function POST(request: Request) {
  const body = await request.json() as ExportBody;
  const { tenant_id, report_type = "sales", format, date_from, date_to, include_products = true, include_services = true } = body;
  if (!tenant_id || (format !== "pdf" && format !== "xlsx")) return NextResponse.json({ error: "Selecciona negocio y formato de exportación." }, { status: 400 });
  if (!include_products && !include_services) return NextResponse.json({ error: "Incluye productos, servicios o ambos." }, { status: 400 });
  const session = await createClient();
  const { data: { user } } = await session.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (!(await requirePermission(user.id, tenant_id, "reports.read"))) return NextResponse.json({ error: "No tienes permiso para exportar reportes." }, { status: 403 });
  const admin = createAdminClient() as unknown as CommerceAdmin;
  const { data: tenant } = await admin.from("tenants").select("name, logo_url").eq("id", tenant_id).maybeSingle();
  if (!tenant) return NextResponse.json({ error: "Negocio no encontrado." }, { status: 404 });
  let query = admin.from("orders").select("order_number, total, paid_total, payment_method, paid_at, created_at, customer_name, items:order_items(quantity, unit_price, subtotal, product:products(name, type))").eq("tenant_id", tenant_id).in("status", ["paid", "completed"]).order("paid_at", { ascending: false });
  if (date_from) query = query.gte("paid_at", toDate(date_from));
  if (date_to) query = query.lte("paid_at", toEndDate(date_to));
  const { data, error } = await query;
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  const orders = ((data ?? []) as ExportOrder[]).filter((order) => (order.items ?? []).some((item) => (item.product?.type === "service" ? include_services : include_products)));
  const totalSales = orders.reduce((sum, order) => sum + Number(order.total), 0);
  const totalCollected = orders.reduce((sum, order) => sum + Number(order.paid_total ?? order.total), 0);
  const filters = { date_from: date_from ?? null, date_to: date_to ?? null, include_products, include_services };
  let bytes: Uint8Array;
  let fileName: string;
  if (format === "xlsx") {
    bytes = await exportWorkbook({ tenantName: tenant.name, reportType: report_type, orders, totalSales, totalCollected, filters });
    fileName = `${report_type === "sales" ? "ventas" : "comisiones"}-${safeName(tenant.name)}.xlsx`;
  } else {
    bytes = await exportPdf({ tenantName: tenant.name, reportType: report_type, orders, totalSales, totalCollected, filters, requestedBy: user.email ?? "Usuario Tlaco" });
    fileName = `${report_type === "sales" ? "ventas" : "comisiones"}-${safeName(tenant.name)}.pdf`;
  }
  await admin.from("report_exports").insert({ tenant_id, requested_by: user.id, report_type, format, filters, row_count: orders.length });
  return new NextResponse(bytes, { headers: { "Content-Type": format === "xlsx" ? "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" : "application/pdf", "Content-Disposition": `attachment; filename="${fileName}"`, "Cache-Control": "no-store" } });
}

async function exportWorkbook(input: { tenantName: string; reportType: string; orders: ExportOrder[]; totalSales: number; totalCollected: number; filters: Record<string, unknown> }) {
  const workbook = new ExcelJS.Workbook();
  workbook.creator = "Tlaco";
  const summary = workbook.addWorksheet("Resumen");
  summary.addRows([["Reporte Tlaco", input.reportType === "sales" ? "Ventas" : "Comisiones"], ["Negocio", input.tenantName], ["Periodo", `${input.filters.date_from ?? "Inicio"} a ${input.filters.date_to ?? "Hoy"}`], ["Órdenes", input.orders.length], ["Ventas", input.totalSales], ["Cobrado", input.totalCollected]]);
  summary.getColumn(1).width = 22; summary.getColumn(2).width = 34; summary.getCell("B5").numFmt = '"$"#,##0.00'; summary.getCell("B6").numFmt = '"$"#,##0.00';
  const ordersSheet = workbook.addWorksheet("Órdenes");
  ordersSheet.columns = [{ header: "Orden", key: "order", width: 16 }, { header: "Cliente", key: "customer", width: 26 }, { header: "Total", key: "total", width: 14 }, { header: "Cobrado", key: "paid", width: 14 }, { header: "Método", key: "payment", width: 18 }, { header: "Pagada", key: "paidAt", width: 22 }];
  input.orders.forEach((order) => ordersSheet.addRow({ order: order.order_number ?? "", customer: order.customer_name ?? "", total: Number(order.total), paid: Number(order.paid_total ?? order.total), payment: order.payment_method ?? "", paidAt: order.paid_at ?? order.created_at }));
  ordersSheet.getColumn("total").numFmt = '"$"#,##0.00'; ordersSheet.getColumn("paid").numFmt = '"$"#,##0.00'; ordersSheet.autoFilter = "A1:F1";
  const items = workbook.addWorksheet("Artículos");
  items.columns = [{ header: "Orden", key: "order", width: 16 }, { header: "Artículo", key: "name", width: 34 }, { header: "Tipo", key: "type", width: 16 }, { header: "Cantidad", key: "quantity", width: 12 }, { header: "Precio unitario", key: "price", width: 16 }, { header: "Subtotal", key: "subtotal", width: 16 }];
  input.orders.forEach((order) => (order.items ?? []).forEach((item) => items.addRow({ order: order.order_number ?? "", name: item.product?.name ?? "Artículo", type: item.product?.type === "service" ? "Servicio" : "Producto", quantity: item.quantity, price: Number(item.unit_price), subtotal: Number(item.subtotal) })));
  items.getColumn("price").numFmt = '"$"#,##0.00'; items.getColumn("subtotal").numFmt = '"$"#,##0.00'; items.autoFilter = "A1:F1";
  return new Uint8Array(await workbook.xlsx.writeBuffer());
}

async function exportPdf(input: { tenantName: string; reportType: string; orders: ExportOrder[]; totalSales: number; totalCollected: number; filters: Record<string, unknown>; requestedBy: string }) {
  const document = await PDFDocument.create(); const font = await document.embedFont(StandardFonts.Helvetica); const bold = await document.embedFont(StandardFonts.HelveticaBold); let page = document.addPage(); let y = 790;
  const write = (text: string, size = 10, isBold = false) => { if (y < 54) { page = document.addPage(); y = 790; } page.drawText(text.slice(0, 118), { x: 42, y, size, font: isBold ? bold : font, color: rgb(0.05, 0.1, 0.2) }); y -= size + 7; };
  write("TLACO", 18, true); write(input.tenantName, 15, true); write(input.reportType === "sales" ? "Reporte de ventas" : "Reporte de comisiones", 13, true); write(`Periodo: ${input.filters.date_from ?? "Inicio"} a ${input.filters.date_to ?? "Hoy"}`); write(`Órdenes: ${input.orders.length}  |  Ventas: ${money(input.totalSales)}  |  Cobrado: ${money(input.totalCollected)}`); y -= 8; write("Orden | Cliente | Total | Método | Fecha", 10, true);
  input.orders.forEach((order) => write(`${order.order_number ?? "—"} | ${order.customer_name ?? "Cliente"} | ${money(Number(order.total))} | ${order.payment_method ?? "—"} | ${(order.paid_at ?? order.created_at).slice(0, 10)}`));
  y -= 10; write(`Generado por ${input.requestedBy} · ${new Date().toLocaleString("es-MX")}`, 8);
  return new Uint8Array(await document.save());
}
function safeName(value: string) { return value.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "") || "tlaco"; }
