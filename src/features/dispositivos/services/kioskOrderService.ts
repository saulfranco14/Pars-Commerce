// Orders raised by a self-service screen: no employee session, so nothing here
// may rely on a membership. `created_by` and `assigned_to` stay null on purpose
// — nobody took this order, and forcing an owner would fake the attribution.

import type { SupabaseClient } from "@supabase/supabase-js";

import {
  buildOrderItemRows,
  filterValidItems,
} from "@/features/qr/helpers/buildOrderItemRows";
import { validateOrderStock } from "@/features/inventory/services/orderStockValidationService";
import {
  readPickupScheduling,
  validateScheduledFor,
} from "@/features/checkout/helpers/pickupSchedule";
import { readBusinessHours } from "@/features/configuracion/helpers/businessHours";

import type {
  CreateKioskOrderInput,
  CreateKioskOrderResult,
} from "@/features/dispositivos/interfaces/kiosk";
import type {
  ServiceError,
  ServiceResult,
} from "@/features/qr/services/tablePaymentService";

function err(
  code: ServiceError["code"],
  message: string,
): { ok: false; error: ServiceError } {
  return { ok: false, error: { code, message } };
}

export async function createKioskOrder(
  admin: SupabaseClient,
  input: CreateKioskOrderInput,
): Promise<ServiceResult<CreateKioskOrderResult>> {
  const valid = filterValidItems(input.items);
  if (valid.length === 0) {
    return err("validation", "Agrega al menos un producto");
  }

  const { data: tenant } = await admin
    .from("tenants")
    .select("id, settings, accepting_orders")
    .eq("id", input.tenantId)
    .maybeSingle();

  if (!tenant) return err("not_found", "Negocio no encontrado");

  if (tenant.accepting_orders === false) {
    return err(
      "conflict",
      "El negocio no está recibiendo pedidos en este momento.",
    );
  }

  const settings = (tenant.settings as Record<string, unknown> | null) ?? {};
  const schedule = validateScheduledFor(
    input.scheduledFor,
    readPickupScheduling(settings),
    new Date(),
    readBusinessHours(settings),
  );
  if (!schedule.ok) return err("validation", schedule.message);

  const productIds = valid.map((i) => i.product_id);
  const { data: products } = await admin
    .from("products")
    .select("id, price")
    .eq("tenant_id", input.tenantId)
    .in("id", productIds)
    .is("deleted_at", null);

  // Prices from the table, never from the screen.
  const priceByProduct = new Map<string, number>();
  for (const p of products ?? []) priceByProduct.set(p.id, Number(p.price));

  const stockValidation = await validateOrderStock(
    admin,
    input.tenantId,
    valid,
  );
  if (!stockValidation.ok) return err("conflict", stockValidation.message);

  const { data: order, error: orderErr } = await admin
    .from("orders")
    .insert({
      tenant_id: input.tenantId,
      status: "in_progress",
      subtotal: 0,
      total: 0,
      discount: 0,
      source: "kiosk",
      order_type: "takeaway",
      device_id: input.deviceId,
      customer_name: input.customerName?.trim() || null,
      scheduled_for: schedule.value?.toISOString() ?? null,
      // Staff still has to prepare it, unlike a counter ticket they assembled.
      fulfillment_status: "received",
    })
    .select("id")
    .single();

  if (orderErr || !order) {
    return err("internal", orderErr?.message ?? "No se pudo crear el pedido");
  }

  const rows = buildOrderItemRows({
    orderId: order.id,
    items: valid,
    priceByProduct,
  });

  if (rows.length === 0) {
    await admin.from("orders").delete().eq("id", order.id);
    return err("validation", "Ningún producto coincide con el negocio");
  }

  const { error: itemsErr } = await admin.from("order_items").insert(rows);
  if (itemsErr) {
    await admin.from("orders").delete().eq("id", order.id);
    return err("internal", itemsErr.message);
  }

  const total = rows.reduce((sum, r) => sum + r.subtotal, 0);
  const now = new Date().toISOString();
  await admin
    .from("orders")
    .update({
      subtotal: total,
      total,
      balance_due: total,
      updated_at: now,
    })
    .eq("id", order.id);

  // Single-use 'order' QR, archived once paid. `created_by` stays null: it
  // references a membership and there is none here.
  const token = crypto.randomUUID().replace(/-/g, "");
  const { data: qr, error: qrErr } = await admin
    .from("qr_codes")
    .insert({
      tenant_id: input.tenantId,
      token,
      kind: "order",
      label: input.customerName?.trim() || "Pedido en pantalla",
      current_order_id: order.id,
      is_active: true,
    })
    .select("id, token")
    .single();

  if (qrErr || !qr) {
    return err("internal", qrErr?.message ?? "No se pudo generar el QR");
  }

  await admin
    .from("orders")
    .update({ qr_code_id: qr.id })
    .eq("id", order.id);

  await admin.from("order_activity_log").insert({
    order_id: order.id,
    actor_type: "device",
    actor_id: input.deviceId,
    actor_label: "pantalla",
    action: "order.created",
    payload: { source: "kiosk", qr_token: token, total },
  });

  return {
    ok: true,
    data: {
      orderId: order.id,
      qrToken: token,
      total,
      orderNumber: order.id.slice(0, 8).toUpperCase(),
    },
  };
}
