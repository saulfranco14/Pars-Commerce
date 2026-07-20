/**
 * Linked tables (shared bill), the LINK model that replaces the old absorb.
 *
 * Linking two tables does NOT move items or cancel/free either order — both
 * stay OCCUPIED and active. They just get the same `merge_group_id`, and reads
 * (bill, pay) aggregate across the group. Unlinking clears the column. New
 * people can scan either QR and land on the shared bill.
 */

import type { SupabaseClient } from "@supabase/supabase-js";

import type { ServiceResult } from "@/features/qr/services/tablePaymentService";

const ACTIVE_STATUSES = ["draft", "assigned", "in_progress", "pending_payment"];

export interface LinkTablesInput {
  /** The order initiating the link (its group id is reused if it has one). */
  primaryOrderId: string;
  /** The order to link into the same group. */
  secondaryOrderId: string;
  actorType: "member" | "device";
  actorId?: string | null;
  actorLabel: string;
}

/**
 * All order ids that share an order's merge group (including itself). Returns
 * just `[orderId]` when the order isn't linked.
 */
export async function getGroupOrderIds(
  admin: SupabaseClient,
  orderId: string,
): Promise<string[]> {
  const { data: order } = await admin
    .from("orders")
    .select("id, merge_group_id")
    .eq("id", orderId)
    .single();
  if (!order) return [orderId];
  if (!order.merge_group_id) return [order.id];

  const { data: members } = await admin
    .from("orders")
    .select("id")
    .eq("merge_group_id", order.merge_group_id);
  return (members ?? []).map((m) => m.id as string);
}

export async function linkTables(
  admin: SupabaseClient,
  input: LinkTablesInput,
): Promise<ServiceResult<{ groupId: string }>> {
  const { primaryOrderId, secondaryOrderId } = input;

  if (primaryOrderId === secondaryOrderId) {
    return {
      ok: false,
      error: { code: "validation", message: "Elige dos mesas distintas." },
    };
  }

  const { data: orders } = await admin
    .from("orders")
    .select("id, tenant_id, status, merge_group_id")
    .in("id", [primaryOrderId, secondaryOrderId]);
  const primary = orders?.find((o) => o.id === primaryOrderId);
  const secondary = orders?.find((o) => o.id === secondaryOrderId);

  if (!primary || !secondary) {
    return {
      ok: false,
      error: { code: "not_found", message: "No encontramos una de las mesas." },
    };
  }
  if (primary.tenant_id !== secondary.tenant_id) {
    return {
      ok: false,
      error: { code: "forbidden", message: "Las mesas son de otro negocio." },
    };
  }
  for (const o of [primary, secondary]) {
    if (!ACTIVE_STATUSES.includes(o.status)) {
      return {
        ok: false,
        error: { code: "conflict", message: "Solo se pueden unir mesas activas." },
      };
    }
  }
  if (
    primary.merge_group_id &&
    secondary.merge_group_id &&
    primary.merge_group_id !== secondary.merge_group_id
  ) {
    return {
      ok: false,
      error: {
        code: "conflict",
        message: "Una de las mesas ya está unida a otro grupo.",
      },
    };
  }

  // Reuse whichever group already exists; otherwise mint one (deterministic:
  // the primary order id doubles as the group id).
  const groupId =
    primary.merge_group_id ?? secondary.merge_group_id ?? primary.id;

  const now = new Date().toISOString();
  const { error } = await admin
    .from("orders")
    .update({ merge_group_id: groupId, updated_at: now })
    .in("id", [primaryOrderId, secondaryOrderId]);
  if (error) {
    return { ok: false, error: { code: "internal", message: error.message } };
  }

  await admin.from("order_activity_log").insert([
    {
      order_id: primaryOrderId,
      actor_type: input.actorType,
      actor_id: input.actorId ?? null,
      actor_label: input.actorLabel,
      action: "table.linked",
      payload: { group_id: groupId, with_order: secondaryOrderId },
    },
    {
      order_id: secondaryOrderId,
      actor_type: input.actorType,
      actor_id: input.actorId ?? null,
      actor_label: input.actorLabel,
      action: "table.linked",
      payload: { group_id: groupId, with_order: primaryOrderId },
    },
  ]);

  return { ok: true, data: { groupId } };
}

/** Remove one order from its group (or, if only two remain, dissolve it). */
export async function unlinkTable(
  admin: SupabaseClient,
  orderId: string,
  actor: { actorType: "member" | "device"; actorId?: string | null; actorLabel: string },
): Promise<ServiceResult<{ dissolved: boolean }>> {
  const { data: order } = await admin
    .from("orders")
    .select("id, merge_group_id")
    .eq("id", orderId)
    .single();
  if (!order || !order.merge_group_id) {
    return {
      ok: false,
      error: { code: "conflict", message: "Esta mesa no está unida." },
    };
  }

  const { data: members } = await admin
    .from("orders")
    .select("id")
    .eq("merge_group_id", order.merge_group_id);
  const ids = (members ?? []).map((m) => m.id as string);
  const now = new Date().toISOString();

  // If removing this one leaves a single member, clear the whole group so no
  // order is left "linked" to nobody.
  const toClear = ids.length <= 2 ? ids : [orderId];
  await admin
    .from("orders")
    .update({ merge_group_id: null, updated_at: now })
    .in("id", toClear);

  await admin.from("order_activity_log").insert({
    order_id: orderId,
    actor_type: actor.actorType,
    actor_id: actor.actorId ?? null,
    actor_label: actor.actorLabel,
    action: "table.unlinked",
    payload: { group_id: order.merge_group_id },
  });

  return { ok: true, data: { dissolved: toClear.length > 1 } };
}
