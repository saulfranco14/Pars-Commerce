/* eslint-disable @typescript-eslint/no-explicit-any -- delivery tables are not in the generated types yet. */
import { requirePermission } from "@/lib/auth/requirePermission";
import { roleHasPermission } from "@/lib/auth/permissions";
import { getMexicoDateBounds, toMexicoDateStr } from "@/lib/dateBounds";
import { stationMeta } from "@/features/operaciones/constants/stations";
import {
  buildColumns,
  buildHistoryColumns,
  rowInStation,
  toBoardOrder,
} from "@/features/operaciones/helpers/boardColumns";
import {
  ACTIVE_WINDOW_MS,
  HIDDEN_STATUSES,
  ORDER_COLUMNS,
  asDb,
  groupBy,
  loadItems,
  loadRouting,
  loadTransferProofs,
} from "@/features/operaciones/services/operationsOrderLoader";
import { sectionPermissions } from "@/constants/dashboardAccess";
import {
  asBillingAdmin,
  getBillingAccount,
} from "@/features/billing/billingService";

import type { Admin } from "@/features/operaciones/services/operationsOrderLoader";
import type { ServiceResult } from "@/features/qr/services/tablePaymentService";
import type { BoardOrderRow } from "@/features/operaciones/helpers/boardColumns";
import type {
  BoardAbilities,
  BoardOrder,
  BoardTeamMember,
  BoardView,
  CollectedSummary,
  StationBoard,
} from "@/features/operaciones/interfaces/board";

const MAX_ORDERS = 200;

// Stations where someone who can hand out work may also assign while charging or delivering.
const TEAM_STATIONS = new Set(["recepcion", "caja", "entregas"]);

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
  const db = asDb(admin);
  let query = db
    .from("orders")
    .select(ORDER_COLUMNS)
    .eq("tenant_id", input.tenantId)
    .not("status", "in", HIDDEN_STATUSES)
    .order("created_at", { ascending: false })
    .limit(MAX_ORDERS);
  const cajaHistory = meta.key === "caja" && view === "done";
  // Caja's history is what was paid today, however old the order is.
  query = cajaHistory ? query.gte("paid_at", todayStart) : query.or(`updated_at.gte.${since},scheduled_for.gte.${since}`);

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

  let rows = (data ?? []) as BoardOrderRow[];
  // The query narrows in SQL; this is the one rule every station view shares.
  if (view === "active") rows = rows.filter((r) => rowInStation(meta.key, r, input.userId));

  const ids = rows.map((r) => r.id);
  const userIds = [...new Set(rows.map((r) => r.assigned_to).filter((id): id is string => Boolean(id)))];
  const proofOrderIds =
    meta.key === "caja" && view === "active"
      ? rows.filter((r) => r.payment_verification_status === "proof_submitted").map((r) => r.id)
      : [];
  const [itemsByOrder, routing, proofs, profiles, activity, approvedPayments] = await Promise.all([
    loadItems(db, ids),
    loadRouting(db, ids),
    loadTransferProofs(admin, proofOrderIds),
    userIds.length ? db.from("profiles").select("id, display_name, email").in("id", userIds) : { data: [] },
    view === "done" && (meta.key === "preparacion" || cajaHistory) && ids.length
      ? db
          .from("order_activity_log")
          .select("order_id, actor_id, created_at, payload")
          .eq("action", cajaHistory ? "payment.confirmed" : "fulfillment.changed")
          .in("order_id", ids)
          .order("created_at", { ascending: true })
      : { data: [] },
    cajaHistory && ids.length
      ? db.from("payments").select("order_id, amount, tip_amount, metadata").eq("status", "approved").in("order_id", ids)
      : { data: [] },
  ]);
  const approvedByOrder = groupBy(approvedPayments.data ?? [], (p: any) => p.order_id);

  const payerDeviceIds = [
    ...new Set(routing.pendingPayments.map((p: any) => p.metadata?.device_id).filter(Boolean)),
  ] as string[];
  const payerDevices = payerDeviceIds.length
    ? await db.from("order_devices").select("id, display_name").in("id", payerDeviceIds)
    : { data: [] };
  const payerName = new Map<string, string>((payerDevices.data ?? []).map((d: any) => [d.id, d.display_name]));

  // The step that closed each order: "ready" for preparation, delivered or picked up for delivery.
  const doneByOrder = new Map<string, { at: string; by: string | null }>();
  if (view === "done") {
    const closing = cajaHistory
      ? rows.map((r) => ({
          orderId: r.id,
          at: r.paid_at as string,
          by: [...(activity.data ?? [])].reverse().find((a: any) => a.order_id === r.id)?.actor_id ?? null,
        }))
      : meta.key === "preparacion"
        ? (activity.data ?? [])
            .filter((a: any) => a.payload?.to === "ready")
            .map((a: any) => ({ orderId: a.order_id, at: a.created_at, by: a.actor_id }))
        : routing.events
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
  const orders = rows.map((row) =>
    toBoardOrder(
      row,
      {
        items: itemsByOrder.get(row.id) ?? [],
        deliveryDetails: routing.detailsByOrder.get(row.id) ?? null,
        deliveryEventTypes: (routing.eventsByOrder.get(row.id) ?? []).map((e: any) => e.type),
        assignedName: row.assigned_to ? (nameOf.get(row.assigned_to) ?? null) : null,
        transferProof: proofs.get(row.id) ?? null,
        pendingPayments: (routing.paymentsByOrder.get(row.id) ?? []).map((p: any) => ({
          id: p.id,
          amount: Number(p.amount),
          tip: Number(p.tip_amount ?? 0),
          method: p.metadata?.method ?? "efectivo",
          payerName: payerName.get(p.metadata?.device_id) ?? null,
        })),
        ...(cajaHistory ? paymentTotals(approvedByOrder.get(row.id) ?? [], row) : {}),
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
      team: can.assign && TEAM_STATIONS.has(meta.key) ? await listAssignableTeam(db, input.tenantId) : [],
      collectedToday: meta.key === "caja" && !cajaHistory ? await collectedSince(db, input.tenantId, todayStart) : null,
      collectedSummary: cajaHistory ? summarizeCollected(orders) : null,
    },
  };
}

/** What an order brought in: approved payments, or the order itself when paid another way. */
function paymentTotals(payments: any[], row: BoardOrderRow) {
  if (payments.length === 0) {
    return { paidAmount: Number(row.paid_total ?? row.total), tip: 0, paymentMethod: row.payment_method ?? null };
  }
  return {
    paidAmount: payments.reduce((sum, p) => sum + Number(p.amount ?? 0), 0),
    tip: payments.reduce((sum, p) => sum + Number(p.tip_amount ?? 0), 0),
    paymentMethod: payments[payments.length - 1]?.metadata?.method ?? row.payment_method ?? null,
  };
}

function summarizeCollected(orders: BoardOrder[]): CollectedSummary {
  const byMethod = new Map<string, number>();
  let total = 0;
  let tips = 0;
  for (const o of orders) {
    const amount = o.paidAmount ?? 0;
    total += amount;
    tips += o.tip;
    const method = o.paymentMethod ?? "otro";
    byMethod.set(method, (byMethod.get(method) ?? 0) + amount);
  }
  return {
    total,
    tips,
    orders: orders.length,
    byMethod: [...byMethod.entries()].map(([method, amount]) => ({ method, amount })).sort((a, b) => b.amount - a.amount),
  };
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
