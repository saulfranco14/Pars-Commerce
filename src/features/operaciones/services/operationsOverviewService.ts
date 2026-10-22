/* eslint-disable @typescript-eslint/no-explicit-any -- delivery tables are not in the generated types yet. */
import { getTenantRole } from "@/lib/auth/requirePermission";
import { roleHasPermission } from "@/lib/auth/permissions";
import { getMexicoDateBounds, toMexicoDateStr } from "@/lib/dateBounds";
import { STATIONS } from "@/features/operaciones/constants/stations";
import { ORDER_PERMISSIONS } from "@/features/orders/constants/orderPermissions";
import { countStations, locateOrder, toBoardOrder } from "@/features/operaciones/helpers/boardColumns";
import {
  ACTIVE_WINDOW_MS,
  HIDDEN_STATUSES,
  ORDER_COLUMNS,
  asDb,
  loadItems,
  loadRouting,
  loadTransferProofs,
} from "@/features/operaciones/services/operationsOrderLoader";
import { asBillingAdmin, getBillingAccount } from "@/features/billing/billingService";

import type { StationKey } from "@/features/operaciones/constants/stations";
import type { Admin } from "@/features/operaciones/services/operationsOrderLoader";
import type { BoardOrderItem, OrderSearchResult, StationCounts } from "@/features/operaciones/interfaces/board";
import type { BoardOrderRow } from "@/features/operaciones/helpers/boardColumns";
import type { TenantPermissionResult } from "@/lib/auth/requirePermission";
import type { ServiceResult } from "@/features/qr/services/tablePaymentService";

const COUNT_LIMIT = 500;
const SEARCH_LIMIT = 20;
const SEARCH_WINDOW_MS = 7 * 24 * 60 * 60 * 1000;
const MONEY_STATIONS: StationKey[] = ["recepcion", "mis-pedidos", "caja"];

interface Viewer {
  role: TenantPermissionResult;
  stations: StationKey[];
}

/** The stations this person can open, or why they can't use Operación at all. */
async function resolveViewer(admin: Admin, userId: string, tenantId: string): Promise<ServiceResult<Viewer>> {
  const role = await getTenantRole(userId, tenantId);
  const stations = role
    ? STATIONS.filter((s) => roleHasPermission(role.roleName, role.permissions, s.permission)).map((s) => s.key)
    : [];
  if (!role || stations.length === 0) {
    return { ok: false, error: { code: "forbidden", message: "Tu rol no tiene acceso a Operación." } };
  }
  const billing = await getBillingAccount(asBillingAdmin(admin), tenantId);
  if (!billing.plan.entitlements.operations_board) {
    return { ok: false, error: { code: "forbidden", message: "Operación está disponible en un plan superior." } };
  }
  return { ok: true, data: { role, stations } };
}

/** Every order with what places it on the route; built as Caja sees it so money rules apply. */
async function toEntries(admin: Admin, rows: BoardOrderRow[], items: Map<string, BoardOrderItem[]>) {
  const ids = rows.map((r) => r.id);
  const proofIds = rows.filter((r) => r.payment_verification_status === "proof_submitted").map((r) => r.id);
  const [routing, proofs] = await Promise.all([loadRouting(asDb(admin), ids), loadTransferProofs(admin, proofIds, { sign: false })]);
  return rows.map((row) => {
    const extras = {
      items: items.get(row.id) ?? [],
      deliveryDetails: routing.detailsByOrder.get(row.id) ?? null,
      deliveryEventTypes: (routing.eventsByOrder.get(row.id) ?? []).map((e: any) => e.type),
      assignedName: null,
      transferProof: proofs.get(row.id) ?? null,
      pendingPayments: (routing.paymentsByOrder.get(row.id) ?? []).map((p: any) => ({
        id: p.id,
        amount: Number(p.amount),
        tip: Number(p.tip_amount ?? 0),
        method: p.metadata?.method ?? "efectivo",
        payerName: null,
      })),
    };
    return { row, extras, order: toBoardOrder(row, extras, "caja") };
  });
}

const todayStart = () => getMexicoDateBounds(toMexicoDateStr(new Date().toISOString())).startUTC;

/** How many orders wait on each station this person can open: the numbers on the station tabs. */
export async function getStationCounts(
  admin: Admin,
  input: { userId: string; tenantId: string },
): Promise<ServiceResult<StationCounts>> {
  const viewer = await resolveViewer(admin, input.userId, input.tenantId);
  if (!viewer.ok) return viewer;

  const since = new Date(Date.now() - ACTIVE_WINDOW_MS).toISOString();
  const { data, error } = await asDb(admin)
    .from("orders")
    .select(ORDER_COLUMNS)
    .eq("tenant_id", input.tenantId)
    .not("status", "in", HIDDEN_STATUSES)
    .or(`updated_at.gte.${since},scheduled_for.gte.${since}`)
    .order("created_at", { ascending: false })
    .limit(COUNT_LIMIT);
  if (error) return { ok: false, error: { code: "internal", message: error.message } };

  const entries = await toEntries(admin, (data ?? []) as BoardOrderRow[], new Map());
  return { ok: true, data: countStations(viewer.data.stations, entries, input.userId, todayStart()) };
}

/** Keeps PostgREST's `or` syntax intact: commas, parentheses and wildcards can't come from the user. */
export function searchTerms(raw: string): { text: string; table: string } | null {
  const text = raw.replace(/[,()%*\\#:]/g, " ").replace(/\s+/g, " ").trim().slice(0, 40);
  if (text.length < 2) return null;
  const table = text.replace(/^mesa\s*/i, "").trim() || text;
  return { text, table };
}

/** Orders by number, customer or table, each with where it sits right now. Only what this role can see. */
export async function searchOperationsOrders(
  admin: Admin,
  input: { userId: string; tenantId: string; query: string },
): Promise<ServiceResult<OrderSearchResult[]>> {
  const viewer = await resolveViewer(admin, input.userId, input.tenantId);
  if (!viewer.ok) return viewer;
  const terms = searchTerms(input.query);
  if (!terms) return { ok: true, data: [] };

  const since = new Date(Date.now() - SEARCH_WINDOW_MS).toISOString();
  const { data, error } = await asDb(admin)
    .from("orders")
    .select(ORDER_COLUMNS)
    .eq("tenant_id", input.tenantId)
    .not("status", "in", HIDDEN_STATUSES)
    .gte("created_at", since)
    .or(`order_number.ilike.%${terms.text}%,customer_name.ilike.%${terms.text}%,table_label.ilike.%${terms.table}%`)
    .order("created_at", { ascending: false })
    .limit(SEARCH_LIMIT);
  if (error) return { ok: false, error: { code: "internal", message: error.message } };

  const rows = (data ?? []) as BoardOrderRow[];
  const entries = await toEntries(admin, rows, await loadItems(asDb(admin), rows.map((r) => r.id)));
  const { role, stations } = viewer.data;
  const seesAll = roleHasPermission(role.roleName, role.permissions, ORDER_PERMISSIONS.viewAll);
  const today = todayStart();

  const results: OrderSearchResult[] = [];
  for (const { row, extras, order } of entries) {
    const locations = locateOrder(stations, row, order, input.userId, today);
    const theirs = row.assigned_to === input.userId || row.created_by === input.userId;
    // Out of every station means finished: only someone who sees all orders, or whose order it is, finds it.
    if (locations.length === 0 && !seesAll && !theirs) continue;
    const shownAs = locations[0]?.station ?? stations.find((s) => MONEY_STATIONS.includes(s)) ?? stations[0];
    results.push({ order: toBoardOrder(row, extras, shownAs), locations });
  }
  // Open work first; finished orders after.
  return { ok: true, data: results.sort((a, b) => Number(b.locations.length > 0) - Number(a.locations.length > 0)) };
}
