import type { StationKey } from "@/features/operaciones/constants/stations";

export type DeliveryStage = "pending" | "on_the_way" | "done";

export type ItemStatus = "received" | "in_progress" | "ready";

export interface BoardOrderItem {
  id: string;
  name: string;
  quantity: number;
  imageUrl: string | null;
  status: ItemStatus;
}

/** Money the customer says they paid, waiting for the business to confirm it. */
export interface BoardPendingPayment {
  id: string;
  amount: number;
  tip: number;
  method: string;
  payerName: string | null;
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
  /** Nothing left to do: closed, or a table that is already paid. */
  finished: boolean;
  /** Only for Caja. */
  pendingPayments: BoardPendingPayment[];
  /** History view: when the step finished and who finished it. */
  doneAt: string | null;
  doneBy: string | null;
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

/** What this person can do right now, read fresh from their role on every refresh. */
export interface BoardAbilities {
  prepare: boolean;
  deliver: boolean;
  assign: boolean;
  collect: boolean;
  openDetail: boolean;
}

export type BoardView = "active" | "done";

export interface StationBoard {
  station: StationKey;
  view: BoardView;
  can: BoardAbilities;
  columns: BoardColumn[];
  /** Only for stations that hand out work (Recepción). */
  team: BoardTeamMember[];
  /** Only for Caja: what was collected today. */
  collectedToday: number | null;
}
