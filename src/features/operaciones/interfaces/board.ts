import type { StationKey } from "@/features/operaciones/constants/stations";

export type DeliveryStage = "pending" | "on_the_way" | "done";

export interface BoardOrderItem {
  name: string;
  quantity: number;
}

/** One card on a station board: only what that work needs. */
export interface BoardOrder {
  id: string;
  number: string;
  status: string;
  fulfillmentStatus: "received" | "in_progress" | "ready";
  /** Where it comes from or where it goes: "Mesa 4", "Tienda en línea", "Mostrador". */
  originLabel: string;
  fulfillmentMethod: "delivery" | "pickup" | null;
  deliveryStage: DeliveryStage;
  createdAt: string;
  scheduledFor: string | null;
  customerName: string | null;
  customerPhone: string | null;
  address: string | null;
  items: BoardOrderItem[];
  paid: boolean;
  total: number | null;
  balanceDue: number | null;
  assignedTo: string | null;
  assignedName: string | null;
}

export interface BoardColumn {
  key: string;
  label: string;
  /** Shown when the column is empty. */
  empty: string;
  orders: BoardOrder[];
}

export interface BoardTeamMember {
  userId: string;
  name: string;
}

export interface StationBoard {
  station: StationKey;
  columns: BoardColumn[];
  /** Only for stations that hand out work (Recepción). */
  team: BoardTeamMember[];
  /** Only for Caja: what was collected today. */
  collectedToday: number | null;
}
