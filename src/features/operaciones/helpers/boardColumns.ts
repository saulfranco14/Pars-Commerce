import { resolveOrderFulfillmentMethod } from "@/features/orders/helpers/resolveOrderFulfillmentMethod";

import type { StationKey } from "@/features/operaciones/constants/stations";
import type {
  BoardColumn,
  BoardOrder,
  BoardOrderItem,
  DeliveryStage,
} from "@/features/operaciones/interfaces/board";

export interface BoardOrderRow {
  id: string;
  order_number: string | null;
  status: string;
  fulfillment_status: string | null;
  fulfillment_method: "delivery" | "pickup" | null;
  source: string;
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
  assigned_to: string | null;
  created_by: string | null;
}

export interface BoardOrderExtras {
  items: BoardOrderItem[];
  deliveryDetails?: { address_text?: string | null; pickup_point_id?: string | null } | null;
  deliveryEventTypes: string[];
  assignedName: string | null;
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
  };
}

const isOpen = (o: BoardOrder) => o.status !== "completed";

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
      return [
        column("ready", "Listos para entregar", "No hay pedidos listos para entregar.", deliverable.filter((o) => o.deliveryStage === "pending")),
        column("on_the_way", "En camino", "Nadie va en camino.", deliverable.filter((o) => o.deliveryStage === "on_the_way")),
      ];
    }
    case "caja": {
      const owing = working.filter((o) => !o.paid && (o.balanceDue ?? 0) > 0);
      return [
        column("ready", "Listos por cobrar", "Nada listo por cobrar.", owing.filter((o) => o.fulfillmentStatus === "ready" || !isOpen(o))),
        column("working", "Aún en proceso", "Nada pendiente de cobro en proceso.", owing.filter((o) => isOpen(o) && o.fulfillmentStatus !== "ready")),
      ];
    }
  }
}
