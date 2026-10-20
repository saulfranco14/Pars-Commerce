/* eslint-disable @typescript-eslint/no-explicit-any -- delivery tables are not in the generated types yet. */
import { requirePermission } from "@/lib/auth/requirePermission";
import { roleHasPermission } from "@/lib/auth/permissions";
import { getMexicoDateBounds, toMexicoDateStr } from "@/lib/dateBounds";
import { requiresReadyBeforePayment } from "@/features/qr/helpers/paymentReadiness";
import { stationMeta } from "@/features/operaciones/constants/stations";
import {
  buildColumns,
  buildHistoryColumns,
  toBoardOrder,
} from "@/features/operaciones/helpers/boardColumns";
import { sectionPermissions } from "@/constants/dashboardAccess";
import {
  asBillingAdmin,
  getBillingAccount,
} from "@/features/billing/billingService";

import type { createAdminClient } from "@/lib/supabase/admin";
import type { ServiceResult } from "@/features/qr/services/tablePaymentService";
import type { BoardOrderRow } from "@/features/operaciones/helpers/boardColumns";
import type {
  BoardAbilities,
  BoardTeamMember,
  BoardView,
  StationBoard,
} from "@/features/operaciones/interfaces/board";

type Admin = ReturnType<typeof createAdminClient>;

// Active work only: an order nobody touched in this long is history, not a task.
const ACTIVE_WINDOW_MS = 36 * 60 * 60 * 1000;
const MAX_ORDERS = 200;
const HIDDEN_STATUSES = "(cancelled,draft,pending_subscription)";

const ORDER_COLUMNS =
  "id, order_number, status, fulfillment_status, fulfillment_method, source, order_type, table_label, created_at, updated_at, scheduled_for, customer_name, customer_phone, total, paid_total, balance_due, paid_at, assigned_to, created_by";

export async function getStationBoard(
  admin: Admin,
  input: { userId: string; tenantId: string; station: string; view?: string },
): Promise<ServiceResult<StationBoard>> {
  const meta = stationMeta(input.station);
  if (!meta) return { ok: false, error: { code: "validation", message: "Esa estación no existe." } };
  const view: BoardView = input.view === "done" ? "done" : "active";
  if (view === "done" && !meta.historyLabel) {
    return { ok: false, error: { code: "validation", message: "Esta estación no tiene historial." } };
  }

  const access = await requirePermission(input.userId, input.tenantId, meta.permission);
  if (!access) {
    return { ok: false, error: { code: "forbidden", message: `Tu rol no tiene acceso a ${meta.label}.` } };
  }
  const billing = await getBillingAccount(asBillingAdmin(admin), input.tenantId);
  if (!billing.plan.entitlements.operations_board) {
    return { ok: false, error: { code: "forbidden", message: "Operación está disponible en un plan superior." } };
  }

  const { startUTC: todayStart } = getMexicoDateBounds(toMexicoDateStr(new Date().toISOString()));
  const since = view === "done" ? todayStart : new Date(Date.now() - ACTIVE_WINDOW_MS).toISOString();
  const db = admin as unknown as { from: (table: string) => any };
  let query = db
    .from("orders")
    .select(ORDER_COLUMNS)
    .eq("tenant_id", input.tenantId)
    .not("status", "in", HIDDEN_STATUSES)
    .or(`updated_at.gte.${since},scheduled_for.gte.${since}`)
    .order("created_at", { ascending: false })
    .limit(MAX_ORDERS);

  if (meta.key === "mis-pedidos") {
    query = query.or(`assigned_to.eq.${input.userId},created_by.eq.${input.userId}`);
  }
  if (meta.key === "preparacion") {
    query =
      view === "done"
        ? query.eq("fulfillment_status", "ready")
        : query.in("fulfillment_status", ["received", "in_progress"]).neq("status", "completed");
  }
  if (meta.key === "entregas") {
    query = query.eq("fulfillment_status", "ready");
    if (view === "active") query = query.neq("status", "completed");
  }

  const { data, error } = await query;
  if (error) return { ok: false, error: { code: "internal", message: error.message } };

  let rows = (data ?? []) as (BoardOrderRow & { order_type: string | null })[];
  // A paid table order is finished; its preparation can no longer move.
  if (meta.key === "preparacion" && view === "active") {
    rows = rows.filter((r) => !(r.status === "paid" && requiresReadyBeforePayment(r.source, r.order_type)));
  }

  const ids = rows.map((r) => r.id);
  const userIds = [...new Set(rows.map((r) => r.assigned_to).filter((id): id is string => Boolean(id)))];
  const [items, details, events, profiles, activity] = await Promise.all([
    ids.length
      ? db
          .from("order_items")
          .select("id, order_id, quantity, fulfillment_status, created_at, product:products(name, image_url)")
          .in("order_id", ids)
          .order("created_at", { ascending: true })
      : { data: [] },
    ids.length
      ? db.from("order_delivery_details").select("order_id, address_text, pickup_point_id").in("order_id", ids)
      : { data: [] },
    ids.length
      ? db.from("order_delivery_events").select("order_id, type, created_at, created_by").in("order_id", ids)
      : { data: [] },
    userIds.length ? db.from("profiles").select("id, display_name, email").in("id", userIds) : { data: [] },
    view === "done" && meta.key === "preparacion" && ids.length
      ? db
          .from("order_activity_log")
          .select("order_id, actor_id, created_at, payload")
          .eq("action", "fulfillment.changed")
          .in("order_id", ids)
          .order("created_at", { ascending: true })
      : { data: [] },
  ]);

  // The step that closed each order: "ready" for preparation, delivered or picked up for delivery.
  const doneByOrder = new Map<string, { at: string; by: string | null }>();
  if (view === "done") {
    const closing =
      meta.key === "preparacion"
        ? (activity.data ?? [])
            .filter((a: any) => a.payload?.to === "ready")
            .map((a: any) => ({ orderId: a.order_id, at: a.created_at, by: a.actor_id }))
        : (events.data ?? [])
            .filter((e: any) => e.type === "delivered" || e.type === "pickup_completed")
            .map((e: any) => ({ orderId: e.order_id, at: e.created_at, by: e.created_by }));
    for (const c of closing) doneByOrder.set(c.orderId, { at: c.at, by: c.by });
  }
  const actorIds = [...new Set([...doneByOrder.values()].map((d) => d.by).filter((id): id is string => Boolean(id)))];
  const actorProfiles = actorIds.length
    ? await db.from("profiles").select("id, display_name, email").in("id", actorIds)
    : { data: [] };

  const nameOf = new Map<string, string>(
    [...(profiles.data ?? []), ...(actorProfiles.data ?? [])].map((p: any) => [
      p.id,
      p.display_name || p.email?.split("@")[0] || "Alguien",
    ]),
  );
  const itemsByOrder = groupBy(items.data ?? [], (i: any) => i.order_id);
  const eventsByOrder = groupBy(events.data ?? [], (e: any) => e.order_id);
  const detailsByOrder = new Map((details.data ?? []).map((d: any) => [d.order_id, d]));

  const orders = rows.map((row) =>
    toBoardOrder(
      row,
      {
        items: (itemsByOrder.get(row.id) ?? []).map((i: any) => ({
          id: i.id,
          name: i.product?.name ?? "Producto",
          quantity: Number(i.quantity),
          imageUrl: i.product?.image_url ?? null,
          status: i.fulfillment_status === "in_progress" || i.fulfillment_status === "ready" ? i.fulfillment_status : "received",
        })),
        deliveryDetails: detailsByOrder.get(row.id) ?? null,
        deliveryEventTypes: (eventsByOrder.get(row.id) ?? []).map((e: any) => e.type),
        assignedName: row.assigned_to ? (nameOf.get(row.assigned_to) ?? null) : null,
        doneAt: doneByOrder.get(row.id)?.at ?? (view === "done" ? row.updated_at : null),
        doneBy: nameOf.get(doneByOrder.get(row.id)?.by ?? "") ?? null,
      },
      meta.key,
    ),
  );

  const has = (permission: string) => roleHasPermission(access.roleName, access.permissions, permission);
  const can: BoardAbilities = {
    prepare: has("orders.prepare"),
    deliver: has("orders.deliver"),
    assign: has("orders.assign"),
    collect: has("payments.write"),
    openDetail: sectionPermissions("ordenes").some(has),
  };

  return {
    ok: true,
    data: {
      station: meta.key,
      view,
      can,
      columns:
        view === "done"
          ? buildHistoryColumns(meta.key, orders, todayStart)
          : buildColumns(meta.key, orders, todayStart),
      team: meta.key === "recepcion" ? await listAssignableTeam(db, input.tenantId) : [],
      collectedToday: meta.key === "caja" ? await collectedSince(db, input.tenantId, todayStart) : null,
    },
  };
}

function groupBy<T>(rows: T[], key: (row: T) => string): Map<string, T[]> {
  const map = new Map<string, T[]>();
  for (const row of rows) {
    const k = key(row);
    map.set(k, [...(map.get(k) ?? []), row]);
  }
  return map;
}

async function listAssignableTeam(db: { from: (t: string) => any }, tenantId: string): Promise<BoardTeamMember[]> {
  const { data: members } = await db
    .from("tenant_memberships")
    .select("user_id")
    .eq("tenant_id", tenantId)
    .eq("status", "active");
  const ids = (members ?? []).map((m: any) => m.user_id);
  if (ids.length === 0) return [];
  const { data: profiles } = await db.from("profiles").select("id, display_name, email").in("id", ids);
  return (profiles ?? [])
    .map((p: any) => ({ userId: p.id, name: p.display_name || p.email?.split("@")[0] || "Sin nombre" }))
    .sort((a: BoardTeamMember, b: BoardTeamMember) => a.name.localeCompare(b.name));
}

async function collectedSince(db: { from: (t: string) => any }, tenantId: string, sinceIso: string): Promise<number> {
  const { data } = await db
    .from("orders")
    .select("paid_total")
    .eq("tenant_id", tenantId)
    .gte("paid_at", sinceIso)
    .neq("status", "cancelled");
  return (data ?? []).reduce((sum: number, o: any) => sum + Number(o.paid_total ?? 0), 0);
}
