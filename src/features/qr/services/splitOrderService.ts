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
  item_ids?: string[];
}

export interface SplitOrderInput {
  orderId: string;
  mode: SplitMode;
  /** Only the table owner can alter a division shared by every diner. */
  fingerprint: string | null;
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

  if (!input.fingerprint) {
    return {
      ok: false,
      error: { code: "forbidden", message: "Identifica tu dispositivo para dividir la cuenta" },
    };
  }

  const { data: splitter } = await admin
    .from("order_devices")
    .select("id, is_owner")
    .eq("order_id", input.orderId)
    .eq("device_fingerprint", input.fingerprint)
    .maybeSingle();
  if (!splitter?.is_owner) {
    return {
      ok: false,
      error: { code: "forbidden", message: "Sólo quien abrió la mesa puede dividir la cuenta" },
    };
  }

  const { data: connectedDevices } = await admin
    .from("order_devices")
    .select("id, display_name, color_hex, joined_at, last_seen_at")
    .eq("order_id", input.orderId)
    .order("joined_at", { ascending: true });
  const devices = connectedDevices ?? [];
  const deviceLabel = (index: number) =>
    devices[index]?.display_name?.trim() || `Persona ${index + 1}`;

  const { data: previousGroups } = await admin
    .from("order_split_groups")
    .select("payment_status")
    .eq("order_id", input.orderId);
  if (
    (previousGroups ?? []).some(
      (group) => group.payment_status !== "pending",
    )
  ) {
    return {
      ok: false,
      error: {
        code: "conflict",
        message: "No puedes cambiar la división mientras una persona ya está pagando o pagó",
      },
    };
  }

  // A draft split can be corrected before anybody starts paying.
  await admin.from("order_split_groups").delete().eq("order_id", input.orderId);

  let groups: GroupPayload[] | null = null;

  if (input.mode === "equal") {
    const people = Math.max(2, Number(input.peopleCount ?? 2));
    if (people > devices.length) {
      return {
        ok: false,
        error: {
          code: "validation",
          message: "Cada persona debe escanear el QR antes de asignarle una parte",
        },
      };
    }
    const eachAmount = Number(order.total) / people;
    groups = Array.from({ length: people }, (_, idx) => ({
      label: deviceLabel(idx),
      total: eachAmount,
      device_id: devices[idx].id,
    }));
  } else if (input.mode === "by_device") {
    const { data: items } = await admin
        .from("order_items")
        .select(
          "id, product_id, quantity, unit_price, subtotal, added_by_device_id, is_shared",
        )
        .eq("order_id", input.orderId);

    const computed = computeSplitByDevice(items ?? [], devices);
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
    if (input.groups.length > devices.length) {
      return {
        ok: false,
        error: {
          code: "validation",
          message: "Cada persona debe escanear el QR antes de asignarle una parte",
        },
      };
    }

    const { data: items } = await admin
      .from("order_items")
      .select("id, subtotal, quantity")
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
      .map((g, index) => ({
        label: deviceLabel(index),
        total: g.item_ids.reduce(
          (acc, id) => acc + (subtotalById.get(id) ?? 0),
          0,
        ),
        device_id: devices[index].id,
        item_ids: g.item_ids,
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

  // The schema already has this relationship. Persist it for the explicit
  // item-assignment mode so future reads can render the real owner, not just
  // the device that originally added the item.
  if (input.mode === "items" && createdGroups) {
    const quantities = new Map(
      (await admin
        .from("order_items")
        .select("id, quantity")
        .eq("order_id", input.orderId)).data?.map((item) => [
        item.id as string,
        Number(item.quantity),
      ]) ?? [],
    );
    const mappings = createdGroups.flatMap((created, index) =>
      (groups?.[index]?.item_ids ?? []).map((orderItemId) => ({
        split_group_id: created.id,
        order_item_id: orderItemId,
        quantity: quantities.get(orderItemId) ?? 1,
      })),
    );
    if (mappings.length > 0) {
      const { error: mappingError } = await admin
        .from("order_split_group_items")
        .insert(mappings);
      if (mappingError) {
        return { ok: false, error: { code: "internal", message: mappingError.message } };
      }
    }
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
