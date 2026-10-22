import { resolveOrderFulfillmentMethod } from "@/features/orders/helpers/resolveOrderFulfillmentMethod";
import { requiresReadyBeforePayment } from "@/features/qr/helpers/paymentReadiness";

import { STATIONS } from "@/features/operaciones/constants/stations";

import type { StationKey } from "@/features/operaciones/constants/stations";
import type {
  BoardColumn,
  BoardOrder,
  BoardOrderItem,
  BoardPendingPayment,
  BoardTransferProof,
  DeliveryStage,
  OrderLocation,
  StationCounts,
} from "@/features/operaciones/interfaces/board";

export interface BoardOrderRow {
  id: string;
  order_number: string | null;
  status: string;
  fulfillment_status: string | null;
  fulfillment_method: "delivery" | "pickup" | null;
  source: string;
  order_type?: string | null;
  table_label: string | null;
  created_at: string;
  updated_at: string;
  scheduled_for: string | null;
  customer_name: string | null;
  customer_phone: string | null;
  total: number;
  paid_total: number | null;
  balance_due: number | null;
  paid_at: string | null;
  payment_method?: string | null;
  assigned_to: string | null;
  created_by: string | null;
  payment_verification_status?: string | null;
}

export interface BoardOrderExtras {
  items: BoardOrderItem[];
  deliveryDetails?: { address_text?: string | null; pickup_point_id?: string | null } | null;
  deliveryEventTypes: string[];
  assignedName: string | null;
  doneAt?: string | null;
  doneBy?: string | null;
  /** Payments the customer declared; their details only reach Caja. */
  pendingPayments?: BoardPendingPayment[];
  transferProof?: BoardTransferProof | null;
  paidAmount?: number | null;
  tip?: number;
  paymentMethod?: string | null;
}

const ORIGIN_LABELS: Record<string, string> = {
  public_store: "Tienda en línea",
  kiosk: "Kiosco",
  whatsapp: "WhatsApp",
  public_request: "Solicitud en línea",
};

export function originLabel(row: Pick<BoardOrderRow, "source" | "table_label">): string {
  const table = row.table_label?.trim();
  if (table) return /^\d+$/.test(table) ? `Mesa ${table}` : table;
  return ORIGIN_LABELS[row.source] ?? "Mostrador";
}

export function isPaid(row: Pick<BoardOrderRow, "status" | "paid_at" | "paid_total" | "total">): boolean {
  return (
    row.status === "paid" ||
    row.status === "completed" ||
    Boolean(row.paid_at) ||
    Number(row.paid_total ?? 0) >= Number(row.total)
  );
}

function deliveryStage(method: BoardOrder["fulfillmentMethod"], events: string[]): DeliveryStage {
  const finished = method === "delivery" ? events.includes("delivered") : events.includes("pickup_completed");
  if (finished) return "done";
  return events.includes("out_for_delivery") ? "on_the_way" : "pending";
}

const MONEY_STATIONS: StationKey[] = ["recepcion", "mis-pedidos", "caja"];

export function toBoardOrder(row: BoardOrderRow, extras: BoardOrderExtras, station: StationKey): BoardOrder {
  const method = resolveOrderFulfillmentMethod({ ...row, delivery_details: extras.deliveryDetails });
  const showMoney = MONEY_STATIONS.includes(station);
  const fulfillment = row.fulfillment_status;
  return {
    id: row.id,
    number: row.order_number ?? row.id.slice(0, 8).toUpperCase(),
    status: row.status,
    source: row.source,
    fulfillmentStatus: fulfillment === "in_progress" || fulfillment === "ready" ? fulfillment : "received",
    originLabel: originLabel(row),
    fulfillmentMethod: method,
    deliveryStage: deliveryStage(method, extras.deliveryEventTypes),
    createdAt: row.created_at,
    scheduledFor: row.scheduled_for,
    customerName: row.customer_name,
    customerPhone: station === "entregas" || station === "recepcion" ? row.customer_phone : null,
    address: method === "delivery" ? (extras.deliveryDetails?.address_text ?? null) : null,
    items: extras.items,
    paid: isPaid(row),
    total: showMoney ? Number(row.total) : null,
    balanceDue: showMoney ? Math.max(0, Number(row.balance_due ?? Number(row.total) - Number(row.paid_total ?? 0))) : null,
    assignedTo: row.assigned_to,
    assignedName: extras.assignedName,
    // A table is paid at the end, so once paid there is nothing left to do.
    finished:
      row.status === "completed" ||
      (row.status === "paid" && requiresReadyBeforePayment(row.source, row.order_type)),
    paysAfterReady: requiresReadyBeforePayment(row.source, row.order_type),
    paymentReview:
      row.payment_verification_status === "proof_submitted"
        ? "proof"
        : (extras.pendingPayments?.length ?? 0) > 0
          ? "declared"
          : null,
    transferProof: station === "caja" ? (extras.transferProof ?? null) : null,
    pendingPayments: station === "caja" ? (extras.pendingPayments ?? []) : [],
    paidAmount: extras.paidAmount ?? null,
    tip: extras.tip ?? 0,
    paymentMethod: extras.paymentMethod ?? row.payment_method ?? null,
    doneAt: extras.doneAt ?? null,
    doneBy: extras.doneBy ?? null,
  };
}

/** "Finished today" page: newest first, so the last one done is on top. */
export function buildHistoryColumns(station: StationKey, orders: BoardOrder[], todayStartIso: string): BoardColumn[] {
  const today = (o: BoardOrder) => (o.doneAt ?? "") >= todayStartIso;
  const newestFirst = (a: BoardOrder, b: BoardOrder) => (b.doneAt ?? "").localeCompare(a.doneAt ?? "");
  if (station === "preparacion") {
    const done = orders.filter((o) => o.fulfillmentStatus === "ready" && today(o)).sort(newestFirst);
    return [column("done", "Preparados hoy", "Aún no terminas pedidos hoy.", done)];
  }
  if (station === "entregas") {
    const done = orders.filter((o) => o.deliveryStage === "done" && today(o)).sort(newestFirst);
    return [column("done", "Entregados hoy", "Aún no entregas pedidos hoy.", done)];
  }
  if (station === "caja") {
    const done = orders.filter((o) => o.paid && today(o)).sort(newestFirst);
    return [column("done", "Cobrado hoy", "Aún no se cobra nada hoy.", done)];
  }
  return [];
}

const isOpen = (o: BoardOrder) => !o.finished;

/** Whether an active order belongs on a station at all; the board query narrows the same way in SQL. */
export function rowInStation(station: StationKey, row: BoardOrderRow, userId: string): boolean {
  switch (station) {
    case "mis-pedidos":
      return row.assigned_to === userId || row.created_by === userId;
    case "preparacion":
      return (
        (row.fulfillment_status === "received" || row.fulfillment_status === "in_progress" || !row.fulfillment_status) &&
        row.status !== "completed" &&
        // A paid table order is finished; its preparation can no longer move.
        !(row.status === "paid" && requiresReadyBeforePayment(row.source, row.order_type))
      );
    case "entregas":
      return row.fulfillment_status === "ready" && row.status !== "completed";
    default:
      return true;
  }
}

// The groups that mean "someone here has to act"; the station's counter adds them up.
const ATTENTION_COLUMNS: Record<StationKey, readonly string[]> = {
  recepcion: ["requests", "unassigned"],
  "mis-pedidos": ["received", "in_progress", "ready"],
  preparacion: ["received", "in_progress"],
  entregas: ["ready"],
  caja: ["to_confirm", "ready"],
};

export function attentionCount(station: StationKey, columns: BoardColumn[]): number {
  return columns
    .filter((c) => ATTENTION_COLUMNS[station].includes(c.key))
    .reduce((sum, c) => sum + c.orders.length, 0);
}

/** Pending work per station, from one shared list of active orders. */
export function countStations(
  stations: StationKey[],
  entries: { row: BoardOrderRow; order: BoardOrder }[],
  userId: string,
  todayStartIso: string,
): StationCounts {
  const counts: StationCounts = {};
  for (const station of stations) {
    const orders = entries.filter((e) => rowInStation(station, e.row, userId)).map((e) => e.order);
    counts[station] = attentionCount(station, buildColumns(station, orders, todayStartIso));
  }
  return counts;
}

/** Every station and group an order sits in right now, for the search results. */
export function locateOrder(
  stations: StationKey[],
  row: BoardOrderRow,
  order: BoardOrder,
  userId: string,
  todayStartIso: string,
): OrderLocation[] {
  const locations: OrderLocation[] = [];
  for (const station of stations) {
    if (!rowInStation(station, row, userId)) continue;
    const column = buildColumns(station, [order], todayStartIso).find((c) => c.key !== "done" && c.orders.length > 0);
    const meta = STATIONS.find((s) => s.key === station);
    if (column && meta) locations.push({ station, stationLabel: meta.label, columnLabel: column.label });
  }
  return locations;
}

function column(key: string, label: string, empty: string, orders: BoardOrder[]): BoardColumn {
  return { key, label, empty, orders };
}

/** Splits the station's orders into its columns. Oldest first: that's the next one to work on. */
export function buildColumns(station: StationKey, orders: BoardOrder[], todayStartIso: string): BoardColumn[] {
  const sorted = [...orders].sort((a, b) => a.createdAt.localeCompare(b.createdAt));
  const working = sorted.filter((o) => o.status !== "pending_acceptance");

  switch (station) {
    case "recepcion":
      return [
        column("requests", "Solicitudes nuevas", "No hay solicitudes por aceptar.", sorted.filter((o) => o.status === "pending_acceptance")),
        column("unassigned", "Sin asignar", "Todo el trabajo tiene responsable.", working.filter((o) => isOpen(o) && !o.assignedTo)),
        column("assigned", "Asignados", "Nadie tiene pedidos en curso.", working.filter((o) => isOpen(o) && o.assignedTo)),
      ];
    case "mis-pedidos":
      return [
        column("received", "Recibidos", "Nada esperando.", working.filter((o) => isOpen(o) && o.fulfillmentStatus === "received")),
        column("in_progress", "En proceso", "Nada en proceso.", working.filter((o) => isOpen(o) && o.fulfillmentStatus === "in_progress")),
        column("ready", "Listos", "Nada listo todavía.", working.filter((o) => isOpen(o) && o.fulfillmentStatus === "ready")),
        column("done", "Terminados hoy", "Aún no cierras pedidos hoy.", working.filter((o) => !isOpen(o) && o.createdAt >= todayStartIso).reverse()),
      ];
    case "preparacion":
      return [
        column("received", "Por preparar", "No hay nada por preparar.", working.filter((o) => isOpen(o) && o.fulfillmentStatus === "received")),
        column("in_progress", "En proceso", "Nada en proceso.", working.filter((o) => isOpen(o) && o.fulfillmentStatus === "in_progress")),
      ];
    case "entregas": {
      const deliverable = working.filter(
        (o) => isOpen(o) && o.fulfillmentStatus === "ready" && o.fulfillmentMethod !== null && o.deliveryStage !== "done",
      );
      const waiting = deliverable.filter((o) => o.deliveryStage === "pending");
      // Delivering never includes charging: an unpaid order waits apart until Caja collects it.
      return [
        column("ready", "Listos para entregar", "No hay pedidos listos para entregar.", waiting.filter((o) => o.paid)),
        column("on_the_way", "En camino", "Nadie va en camino.", deliverable.filter((o) => o.deliveryStage === "on_the_way")),
        column("awaiting_payment", "Esperando cobro", "Nada espera a Caja.", waiting.filter((o) => !o.paid)),
      ];
    }
    case "caja": {
      const awaitsReview = (o: BoardOrder) => o.pendingPayments.length > 0 || o.transferProof !== null;
      const toConfirm = working.filter(awaitsReview);
      const owing = working.filter((o) => !o.paid && (o.balanceDue ?? 0) > 0 && !awaitsReview(o));
      return [
        column("to_confirm", "Pagos por confirmar", "Nadie ha reportado un pago.", toConfirm),
        column("ready", "Listos por cobrar", "Nada listo por cobrar.", owing.filter((o) => o.fulfillmentStatus === "ready" || !isOpen(o))),
        column("working", "Aún en proceso", "Nada pendiente de cobro en proceso.", owing.filter((o) => isOpen(o) && o.fulfillmentStatus !== "ready")),
      ];
    }
  }
}
