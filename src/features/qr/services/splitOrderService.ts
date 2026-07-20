/**
 * Domain service that handles splitting an order's bill in 3 modes:
 *  - by_device: derive groups from order_items.added_by_device_id
 *  - equal: divide the total between N people
 *  - items: caller provides explicit { label, item_ids[] } groups
 *
 * Each mode produces a homogeneous `GroupPayload[]` that we then persist with
 * the same `insertSplitGroups` step. Activity log is written once at the end.
 */

import type { SupabaseClient } from "@supabase/supabase-js";

import { computeSplitByDevice } from "@/features/qr/helpers/computeSplitByDevice";
import type { ServiceResult } from "@/features/qr/services/tablePaymentService";

export type SplitMode = "by_device" | "equal" | "items";

interface GroupPayload {
  label: string;
  total: number;
  device_id: string | null;
}

export interface SplitOrderInput {
  orderId: string;
  mode: SplitMode;
  peopleCount?: number;
  groups?: Array<{ label: string; item_ids: string[] }>;
}

export interface SplitOrderResult {
  groups: Array<{
    id: string;
    label: string;
    total: number;
    paid_total: number;
    balance_due: number;
    payment_status: string;
    device_id: string | null;
  }>;
}

export async function splitOrder(
  admin: SupabaseClient,
  input: SplitOrderInput,
): Promise<ServiceResult<SplitOrderResult>> {
  const { data: order } = await admin
    .from("orders")
    .select("id, total, status")
    .eq("id", input.orderId)
    .single();

  if (!order) {
    return { ok: false, error: { code: "not_found", message: "Orden no encontrada" } };
  }
  if (order.status === "paid" || order.status === "cancelled") {
    return {
      ok: false,
      error: {
        code: "conflict",
        message: "No se puede dividir una orden cerrada",
      },
    };
  }

  // Replace previous split (UX allows redoing the split from the public bill).
  await admin.from("order_split_groups").delete().eq("order_id", input.orderId);

  let groups: GroupPayload[] | null = null;

  if (input.mode === "equal") {
    const people = Math.max(2, Number(input.peopleCount ?? 2));
    const eachAmount = Number(order.total) / people;
    groups = Array.from({ length: people }, (_, idx) => ({
      label: `Persona ${idx + 1}`,
      total: eachAmount,
      device_id: null,
    }));
  } else if (input.mode === "by_device") {
    const [{ data: devices }, { data: items }] = await Promise.all([
      admin
        .from("order_devices")
        .select("id, display_name, color_hex, joined_at, last_seen_at")
        .eq("order_id", input.orderId),
      admin
        .from("order_items")
        .select(
          "id, product_id, quantity, unit_price, subtotal, added_by_device_id, is_shared",
        )
        .eq("order_id", input.orderId),
    ]);

    const computed = computeSplitByDevice(items ?? [], devices ?? []);
    groups = computed.map((entry) => ({
      label: entry.label,
      total: entry.total,
      device_id: entry.deviceId,
    }));
  } else {
    // items
    if (!input.groups || input.groups.length === 0) {
      return {
        ok: false,
        error: {
          code: "validation",
          message: "Define al menos un grupo de items",
        },
      };
    }

    const { data: items } = await admin
      .from("order_items")
      .select("id, subtotal")
      .eq("order_id", input.orderId);

    const subtotalById = new Map<string, number>();
    for (const item of items ?? []) {
      subtotalById.set(item.id, Number(item.subtotal));
    }

    const seen = new Set<string>();
    for (const group of input.groups) {
      for (const id of group.item_ids) {
        if (!subtotalById.has(id)) {
          return {
            ok: false,
            error: {
              code: "validation",
              message: "Hay items inválidos en la división",
            },
          };
        }
        if (seen.has(id)) {
          return {
            ok: false,
            error: {
              code: "validation",
              message: "Un item no puede asignarse a dos grupos",
            },
          };
        }
        seen.add(id);
      }
    }

    if (seen.size !== subtotalById.size) {
      return {
        ok: false,
        error: {
          code: "validation",
          message: "Todos los items deben asignarse antes de dividir",
        },
      };
    }

    groups = input.groups
      .map((g) => ({
        label: g.label.trim() || "Cuenta",
        total: g.item_ids.reduce(
          (acc, id) => acc + (subtotalById.get(id) ?? 0),
          0,
        ),
        device_id: null,
      }))
      .filter((g) => g.total > 0);
  }

  if (!groups || groups.length === 0) {
    return {
      ok: false,
      error: {
        code: "validation",
        message: "No se pudo generar grupos para dividir la cuenta",
      },
    };
  }

  const payload = groups.map((g) => ({
    order_id: input.orderId,
    device_id: g.device_id,
    label: g.label,
    subtotal: g.total,
    total: g.total,
    paid_total: 0,
    balance_due: g.total,
    payment_status: "pending",
  }));

  const { data: createdGroups, error: insertError } = await admin
    .from("order_split_groups")
    .insert(payload)
    .select("id, label, total, paid_total, balance_due, payment_status, device_id");

  if (insertError) {
    return { ok: false, error: { code: "internal", message: insertError.message } };
  }

  await admin
    .from("orders")
    .update({ status: "pending_payment" })
    .eq("id", input.orderId);

  await admin.from("order_activity_log").insert({
    order_id: input.orderId,
    actor_type: "device",
    actor_label: "cliente",
    action: "split.created",
    payload: { mode: input.mode, groups: payload.length },
  });

  return { ok: true, data: { groups: createdGroups ?? [] } };
}
