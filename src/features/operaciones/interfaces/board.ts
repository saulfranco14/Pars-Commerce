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

/** A transfer receipt the customer uploaded, waiting for someone to check the bank. */
export interface BoardTransferProof {
  id: string;
  amountClaimed: number | null;
  fileType: string;
  createdAt: string;
  /** Short-lived link to the file; null when it could not be signed. */
  url: string | null;
}

/** The business still has to confirm money the customer says they sent. */
export type PaymentReview = "proof" | "declared";

export type JourneyState = "done" | "now" | "wait" | "todo";

/** One step of the order's route on its card: what is done, happening, waiting or pending. */
export interface JourneyStep {
  key: "start" | "prep" | "pay" | "delivery";
  label: string;
  detail: string;
  state: JourneyState;
}

/** One card on a station board: only what that work needs. */
export interface BoardOrder {
  id: string;
  number: string;
  status: string;
  source: string;
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
  /** Tables pay at the end: charging opens only once everything is ready. */
  paysAfterReady: boolean;
  paymentReview: PaymentReview | null;
  /** Only for Caja. */
  transferProof: BoardTransferProof | null;
  /** Only for Caja. */
  pendingPayments: BoardPendingPayment[];
  /** Caja history: what came in for this order today. */
  paidAmount: number | null;
  tip: number;
  paymentMethod: string | null;
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

/** How many orders wait on each station the person can open. */
export type StationCounts = Partial<Record<StationKey, number>>;

/** Where a found order is right now, in words. */
export interface OrderLocation {
  station: StationKey;
  stationLabel: string;
  columnLabel: string;
}

export interface OrderSearchResult {
  order: BoardOrder;
  /** Empty when it no longer sits in any station. */
  locations: OrderLocation[];
}

export interface StationBoard {
  station: StationKey;
  view: BoardView;
  can: BoardAbilities;
  columns: BoardColumn[];
  /** Recepción, Caja and Entregas, only for someone who can assign. */
  team: BoardTeamMember[];
  /** Only for Caja: what was collected today. */
  collectedToday: number | null;
  /** Only for Caja's history: today's total split by method, and tips apart. */
  collectedSummary: CollectedSummary | null;
}

export interface CollectedSummary {
  total: number;
  tips: number;
  orders: number;
  byMethod: { method: string; amount: number }[];
}
