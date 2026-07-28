/**
 * Orden ligada: recoge "lo que faltó" de un pedido ya pagado.
 *
 * Lo que hace que funcione es una OMISIÓN: el hijo no escribe
 * `qr_codes.current_order_id` ni copia `qr_code_id`, así que la mesa no se
 * re-ocupa. `/api/qr/resolve` busca el pedido activo por `current_order_id`
 * (nunca por `qr_code_id`) y `releaseTableQrIfPaid` se rinde si no apunta a
 * ese pedido. No le pongas `qr_code_id` al hijo.
 */

import type { SupabaseClient } from "@supabase/supabase-js";

import {
  buildOrderItemRows,
  filterValidItems,
} from "@/features/qr/helpers/buildOrderItemRows";

import type {
  CreateAddendumInput,
  CreateAddendumResult,
} from "@/features/orders/interfaces/orderAddendum";
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

/**
 * Solo se complementa lo que el cliente ya cerró. Sobre un pedido todavía
 * abierto no hace falta nada de esto: se le agregan los ítems y ya.
 */
const COMPLEMENTABLE_STATUSES = ["paid", "completed"];

export async function createOrderAddendum(
  admin: SupabaseClient,
  input: CreateAddendumInput,
): Promise<ServiceResult<CreateAddendumResult>> {
  const valid = filterValidItems(input.items);
  if (valid.length === 0) {
    return err("validation", "Agrega al menos un producto o servicio");
  }

  const { data: parent } = await admin
    .from("orders")
    .select(
      "id, tenant_id, status, parent_order_id, order_type, table_label, customer_id, customer_name, customer_email, customer_phone",
    )
    .eq("id", input.parentOrderId)
    .maybeSingle();

  if (!parent) return err("not_found", "No encontramos el pedido original");

  if (!COMPLEMENTABLE_STATUSES.includes(parent.status)) {
    return err(
      "conflict",
      "Este pedido todavía está abierto. Agrega los productos directamente en él.",
    );
  }

  // El trigger de la base también lo impide; aquí el mensaje puede decir qué
  // hacer en vez de solo fallar.
  if (parent.parent_order_id) {
    return err(
      "conflict",
      "Este ya es un pedido complementario. Agrega lo que falta al pedido original.",
    );
  }

  const productIds = valid.map((i) => i.product_id);
  const { data: products } = await admin
    .from("products")
    .select("id, price")
    .eq("tenant_id", parent.tenant_id)
    .in("id", productIds)
    .is("deleted_at", null);

  // Precios de la tabla, nunca del cliente.
  const priceByProduct = new Map<string, number>();
  for (const p of products ?? []) priceByProduct.set(p.id, Number(p.price));

  const { data: child, error: childErr } = await admin
    .from("orders")
    .insert({
      tenant_id: parent.tenant_id,
      parent_order_id: parent.id,
      status: "in_progress",
      subtotal: 0,
      total: 0,
      discount: 0,
      source: "addendum",
      order_type: parent.order_type,
      // `table_label` sí; `qr_code_id` NO — ver la cabecera del archivo.
      table_label: parent.table_label,
      customer_id: parent.customer_id,
      customer_name: parent.customer_name,
      customer_email: parent.customer_email,
      customer_phone: parent.customer_phone,
      created_by: input.actorUserId,
      assigned_to: input.actorUserId,
      // Ya se entregó: no hay nada que preparar, nace cobrable.
      fulfillment_status: "ready",
    })
    .select("id")
    .single();

  if (childErr || !child) {
    return err(
      "internal",
      childErr?.message ?? "No se pudo crear el pedido complementario",
    );
  }

  const rows = buildOrderItemRows({
    orderId: child.id,
    items: valid,
    priceByProduct,
    addedByMemberId: input.actorMembershipId,
    originTableLabel: parent.table_label,
  });

  if (rows.length === 0) {
    // No dejar un pedido de $0 colgando del original.
    await admin.from("orders").delete().eq("id", child.id);
    return err("validation", "Ningún producto coincide con el negocio");
  }

  const { error: itemsErr } = await admin.from("order_items").insert(rows);
  if (itemsErr) {
    await admin.from("orders").delete().eq("id", child.id);
    return err("internal", itemsErr.message);
  }

  const total = rows.reduce((sum, r) => sum + r.subtotal, 0);
  await admin
    .from("orders")
    .update({
      subtotal: total,
      total,
      balance_due: total,
      updated_at: new Date().toISOString(),
    })
    .eq("id", child.id);

  // En AMBOS: quien audite el cobro original tiene que ver que se complementó
  // después sin ir a buscarlo.
  await admin.from("order_activity_log").insert([
    {
      order_id: child.id,
      actor_type: "member",
      actor_id: input.actorUserId,
      actor_label: "personal",
      action: "order.addendum_created",
      payload: {
        parent_order_id: parent.id,
        total,
        reason: input.reason?.trim() || null,
      },
    },
    {
      order_id: parent.id,
      actor_type: "member",
      actor_id: input.actorUserId,
      actor_label: "personal",
      action: "order.addendum_attached",
      payload: {
        child_order_id: child.id,
        total,
        reason: input.reason?.trim() || null,
      },
    },
  ]);

  return {
    ok: true,
    data: { orderId: child.id, parentOrderId: parent.id, total },
  };
}
