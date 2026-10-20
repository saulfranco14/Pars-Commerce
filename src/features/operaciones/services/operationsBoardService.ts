/* eslint-disable @typescript-eslint/no-explicit-any -- delivery tables are not in the generated types yet. */
import { requirePermission } from "@/lib/auth/requirePermission";
import { getMexicoDateBounds, toMexicoDateStr } from "@/lib/dateBounds";
import { requiresReadyBeforePayment } from "@/features/qr/helpers/paymentReadiness";
import { stationMeta } from "@/features/operaciones/constants/stations";
import { buildColumns, toBoardOrder } from "@/features/operaciones/helpers/boardColumns";
import {
  asBillingAdmin,
  getBillingAccount,
} from "@/features/billing/billingService";

import type { createAdminClient } from "@/lib/supabase/admin";
import type { ServiceResult } from "@/features/qr/services/tablePaymentService";
import type { BoardOrderRow } from "@/features/operaciones/helpers/boardColumns";
import type { BoardTeamMember, StationBoard } from "@/features/operaciones/interfaces/board";

type Admin = ReturnType<typeof createAdminClient>;

// Active work only: an order nobody touched in this long is history, not a task.
const ACTIVE_WINDOW_MS = 36 * 60 * 60 * 1000;
const MAX_ORDERS = 200;
const HIDDEN_STATUSES = "(cancelled,draft,pending_subscription)";

const ORDER_COLUMNS =
  "id, order_number, status, fulfillment_status, fulfillment_method, source, order_type, table_label, created_at, updated_at, scheduled_for, customer_name, customer_phone, total, paid_total, balance_due, paid_at, assigned_to, created_by";

export async function getStationBoard(
  admin: Admin,
  input: { userId: string; tenantId: string; station: string },
): Promise<ServiceResult<StationBoard>> {
  const meta = stationMeta(input.station);
  if (!meta) return { ok: false, error: { code: "validation", message: "Esa estación no existe." } };

  const access = await requirePermission(input.userId, input.tenantId, meta.permission);
  if (!access) {
    return { ok: false, error: { code: "forbidden", message: `Tu rol no tiene acceso a ${meta.label}.` } };
  }
  const billing = await getBillingAccount(asBillingAdmin(admin), input.tenantId);
  if (!billing.plan.entitlements.operations_board) {
    return { ok: false, error: { code: "forbidden", message: "Operación está disponible en un plan superior." } };
  }

  const since = new Date(Date.now() - ACTIVE_WINDOW_MS).toISOString();
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
    query = query.in("fulfillment_status", ["received", "in_progress"]).neq("status", "completed");
  }
  if (meta.key === "entregas") {
    query = query.eq("fulfillment_status", "ready").neq("status", "completed");
  }

  const { data, error } = await query;
  if (error) return { ok: false, error: { code: "internal", message: error.message } };

  let rows = (data ?? []) as (BoardOrderRow & { order_type: string | null })[];
  // A paid table order is finished; its preparation can no longer move.
  if (meta.key === "preparacion") {
    rows = rows.filter((r) => !(r.status === "paid" && requiresReadyBeforePayment(r.source, r.order_type)));
  }

  const ids = rows.map((r) => r.id);
  const userIds = [...new Set(rows.map((r) => r.assigned_to).filter((id): id is string => Boolean(id)))];
  const [items, details, events, profiles] = await Promise.all([
    ids.length
      ? db.from("order_items").select("order_id, quantity, product:products(name)").in("order_id", ids)
      : { data: [] },
    ids.length
      ? db.from("order_delivery_details").select("order_id, address_text, pickup_point_id").in("order_id", ids)
      : { data: [] },
    ids.length ? db.from("order_delivery_events").select("order_id, type").in("order_id", ids) : { data: [] },
    userIds.length ? db.from("profiles").select("id, display_name, email").in("id", userIds) : { data: [] },
  ]);

  const nameOf = new Map<string, string>(
    (profiles.data ?? []).map((p: any) => [p.id, p.display_name || p.email?.split("@")[0] || "Alguien"]),
  );
  const itemsByOrder = groupBy(items.data ?? [], (i: any) => i.order_id);
  const eventsByOrder = groupBy(events.data ?? [], (e: any) => e.order_id);
  const detailsByOrder = new Map((details.data ?? []).map((d: any) => [d.order_id, d]));

  const orders = rows.map((row) =>
    toBoardOrder(
      row,
      {
        items: (itemsByOrder.get(row.id) ?? []).map((i: any) => ({
          name: i.product?.name ?? "Producto",
          quantity: Number(i.quantity),
        })),
        deliveryDetails: detailsByOrder.get(row.id) ?? null,
        deliveryEventTypes: (eventsByOrder.get(row.id) ?? []).map((e: any) => e.type),
        assignedName: row.assigned_to ? (nameOf.get(row.assigned_to) ?? null) : null,
      },
      meta.key,
    ),
  );

  const { startUTC: todayStart } = getMexicoDateBounds(toMexicoDateStr(new Date().toISOString()));

  return {
    ok: true,
    data: {
      station: meta.key,
      columns: buildColumns(meta.key, orders, todayStart),
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
