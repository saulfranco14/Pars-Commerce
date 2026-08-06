import { NextResponse } from "next/server";

import { createAdminClient } from "@/lib/supabase/admin";
import { resolveUserError } from "@/lib/errors/resolveUserError";
import { filterValidItems } from "@/features/qr/helpers/buildOrderItemRows";
import { validateOrderStock } from "@/features/inventory/services/orderStockValidationService";
import { identifyCustomer, normalizeMxPhone } from "@/lib/customers/customerIdentity";

interface TableItemPayload {
  product_id: string;
  quantity: number;
  is_shared?: boolean;
}

interface RequestBody {
  qr_token: string;
  display_name: string;
  customer_phone?: string;
  items: TableItemPayload[];
}

function submitErrorMessage(message: string) {
  if (/table is full/i.test(message)) {
    return "Esta mesa ya llegÃ³ a su capacidad. Pide al personal que la amplÃ­e o te asigne otra.";
  }
  if (/no longer accepts/i.test(message)) {
    return "La cuenta ya estÃ¡ en proceso de pago y no acepta nuevos productos.";
  }
  if (/product is not available/i.test(message)) {
    return "Uno de los productos ya no estÃ¡ disponible. Actualiza el menÃº e intÃ©ntalo de nuevo.";
  }
  return resolveUserError({ message } as never, "supabase");
}

/**
 * First actual submit is the table's commit point. The database function locks
 * the QR, creates/reuses one active order, identifies this customer and adds
 * their lines in the same transaction. A mere scan never reaches this route.
 */
export async function POST(request: Request) {
  let body: RequestBody;
  try {
    body = (await request.json()) as RequestBody;
  } catch {
    return NextResponse.json({ error: "JSON invÃ¡lido" }, { status: 400 });
  }

  const fingerprint = request.headers.get("x-fingerprint-id")?.trim();
  const displayName = body.display_name?.trim();
  const validItems = filterValidItems(body.items ?? []);
  if (!body.qr_token || !fingerprint || !displayName || validItems.length === 0) {
    return NextResponse.json(
      { error: "Nombre, mesa e items vÃ¡lidos son requeridos" },
      { status: 400 },
    );
  }
  if (!body.customer_phone?.trim() || !normalizeMxPhone(body.customer_phone)) {
    return NextResponse.json({ error: "Confirma un teléfono válido antes de enviar tu pedido" }, { status: 400 });
  }
  if (displayName.length > 40) {
    return NextResponse.json(
      { error: "El nombre no puede tener mÃ¡s de 40 caracteres" },
      { status: 400 },
    );
  }

  const admin = createAdminClient();
  const { data: qrCode } = await admin
    .from("qr_codes")
    .select("id, tenant_id")
    .eq("token", body.qr_token)
    .eq("kind", "table")
    .eq("is_active", true)
    .is("archived_at", null)
    .maybeSingle();

  if (!qrCode) {
    return NextResponse.json({ error: "Mesa no encontrada o inactiva" }, { status: 404 });
  }

  // Friendly preflight. The payment-time inventory trigger remains the
  // authoritative concurrent guard, exactly as it is for staff orders.
  const stockValidation = await validateOrderStock(
    admin,
    qrCode.tenant_id,
    validItems,
  );
  if (!stockValidation.ok) {
    return NextResponse.json({ error: stockValidation.message }, { status: 409 });
  }

  const { data, error } = await admin.rpc(
    "submit_table_order" as never,
    {
      p_qr_token: body.qr_token,
      p_device_fingerprint: fingerprint,
      p_display_name: displayName,
      p_items: validItems,
    } as never,
  );
  const submitted = data as unknown as Array<{
    order_id: string;
    device_id: string;
    added_items: number;
  }> | null;

  if (error || !submitted?.[0]) {
    const message = submitErrorMessage(error?.message ?? "No se pudo enviar el pedido");
    const status = /capacidad|proceso de pago|disponible/i.test(message) ? 409 : 500;
    return NextResponse.json({ error: message }, { status });
  }

  const result = submitted[0];
  // Identity is optional during the migration from name-only table sessions.
  // When supplied on the first real order, it is tenant-scoped and linked to
  // this participant, never created merely by scanning the QR.
  let customerId: string | null = null;
  if (body.customer_phone?.trim()) {
    const identity = await identifyCustomer({
      admin,
      tenantId: qrCode.tenant_id,
      displayName,
      phone: body.customer_phone,
      fingerprint,
    });
    if ("error" in identity) {
      return NextResponse.json({ error: identity.error }, { status: 422 });
    }
    customerId = identity.customer.id;
    await admin.from("order_devices").update({ customer_id: customerId, updated_at: new Date().toISOString() } as never).eq("id", result.device_id);
  }
  const { data: order } = await admin
    .from("orders")
    .select("id, status, subtotal, total, paid_total, balance_due, fulfillment_status")
    .eq("id", result.order_id)
    .single();

  return NextResponse.json({
    success: true,
    order,
    device_id: result.device_id,
    customer_id: customerId,
    added_items: result.added_items,
  });
}
