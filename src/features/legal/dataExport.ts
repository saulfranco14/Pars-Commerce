import { createHash } from "crypto";

import { createStoredZip } from "@/features/legal/simpleZip";

type Admin = { from: (table: string) => any; storage: { from: (bucket: string) => any } };

const safeJson = (value: unknown) => JSON.stringify(value, null, 2);
const hash = (value: string) => createHash("sha256").update(value).digest("hex");

export async function buildTenantDataExport(admin: Admin, tenantId: string, requestedBy: string) {
  const exportRow = await admin.from("legal_data_exports").insert({ tenant_id: tenantId, requested_by: requestedBy, status: "pending" }).select("id").single();
  if (exportRow.error || !exportRow.data) throw new Error(exportRow.error?.message ?? "No pudimos preparar la exportación.");
  const exportId = exportRow.data.id as string;
  try {
    const [tenant, products, customers, orders] = await Promise.all([
      admin.from("tenants").select("id, name, slug, business_type, description, created_at").eq("id", tenantId).single(),
      admin.from("products").select("id, name, slug, price, stock, type, created_at, updated_at").eq("tenant_id", tenantId).is("deleted_at", null),
      admin.from("customers").select("id, name, email, phone, created_at, updated_at").eq("tenant_id", tenantId),
      admin.from("orders").select("id, order_number, status, subtotal, total, paid_total, payment_method, created_at, paid_at, customer_name, customer_email, customer_phone").eq("tenant_id", tenantId),
    ]);
    if (tenant.error || products.error || customers.error || orders.error) throw new Error("No pudimos reunir todos los datos para la exportación.");
    const orderIds = (orders.data ?? []).map((order: { id: string }) => order.id);
    const orderItems = orderIds.length
      ? await admin.from("order_items").select("id, order_id, product_id, quantity, unit_price, subtotal, created_at").in("order_id", orderIds)
      : { data: [], error: null };
    if (orderItems.error) throw new Error("No pudimos reunir los artículos de las órdenes.");
    const files = {
      "business.json": safeJson(tenant.data),
      "products.json": safeJson(products.data ?? []),
      "customers.json": safeJson(customers.data ?? []),
      "orders.json": safeJson(orders.data ?? []),
      "order_items.json": safeJson(orderItems.data ?? []),
      "README.txt": "Exportación de Tlaco. Incluye datos operativos del negocio y no incluye credenciales, contraseñas ni secretos de pago.\n",
    };
    const manifest = { export_id: exportId, tenant_id: tenantId, generated_at: new Date().toISOString(), files: Object.entries(files).map(([name, content]) => ({ name, bytes: new TextEncoder().encode(content).length, sha256: hash(content) })) };
    const zip = createStoredZip([...Object.entries(files).map(([name, content]) => ({ name, content })), { name: "manifest.json", content: safeJson(manifest) }]);
    const path = `${tenantId}/${exportId}.zip`;
    const upload = await admin.storage.from("legal-exports").upload(path, zip, { contentType: "application/zip", upsert: false });
    if (upload.error) throw new Error(upload.error.message);
    const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString();
    await admin.from("legal_data_exports").update({ status: "ready", storage_path: path, expires_at: expiresAt, completed_at: new Date().toISOString() }).eq("id", exportId);
    return { exportId, path, expiresAt };
  } catch (error) {
    await admin.from("legal_data_exports").update({ status: "failed", error_message: error instanceof Error ? error.message : "Error al exportar" }).eq("id", exportId);
    throw error;
  }
}
