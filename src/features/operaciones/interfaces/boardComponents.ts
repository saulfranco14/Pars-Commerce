import type { ReactNode } from "react";

import type { BoardColumn } from "@/features/operaciones/interfaces/board";

import type { StationBoardController } from "@/features/operaciones/hooks/useStationBoard";
import type { StationKey, StationMeta } from "@/features/operaciones/constants/stations";
import type {
  BoardOrder,
  BoardOrderItem,
  BoardTransferProof,
  CollectedSummary,
  BoardPendingPayment,
  BoardTeamMember,
  BoardView,
  JourneyStep,
  StationCounts,
} from "@/features/operaciones/interfaces/board";
import type { FulfillmentStatus } from "@/features/qr/services/tableFulfillmentService";

export interface StationBoardViewProps {
  station: StationMeta;
  tenantId: string;
  tenantSlug: string;
  /** "done" is the station's "finished today" page. */
  view?: BoardView;
}

export interface BoardOrderCardProps {
  order: BoardOrder;
  now: number;
  /** Only for roles that can open the order detail. */
  detailHref?: string;
  showTimer?: boolean;
  /** Collapsed to one line until tapped: for long queues. */
  compact?: boolean;
  canAdvanceItems?: boolean;
  busyItemId?: string | null;
  /** An action on this order is running: every button waits. */
  locked?: boolean;
  onAdvanceItem?: (itemId: string, status: FulfillmentStatus) => void;
  children?: ReactNode;
}

export interface BoardItemRowProps {
  item: BoardOrderItem;
  canAdvance: boolean;
  /** This line is the one moving (shows the spinner). */
  busy: boolean;
  /** Another action on the order is running. */
  locked: boolean;
  onAdvance: (status: FulfillmentStatus) => void;
}

export interface StationCardActionsProps {
  station: StationKey;
  order: BoardOrder;
  board: StationBoardController;
  team: BoardTeamMember[];
  detailHref?: string;
  onDeliver: (order: BoardOrder) => void;
  onReject: (order: BoardOrder) => void;
  onRejectPayment: (paymentId: string) => void;
  onRejectProof: (order: BoardOrder) => void;
  onCharge: (order: BoardOrder) => void;
}

export interface OrderJourneyProps {
  steps: JourneyStep[];
}

export interface TransferProofRowProps {
  proof: BoardTransferProof;
  /** What the order still owes, when the customer didn't type an amount. */
  fallbackAmount: number | null;
  busy: boolean;
  onApprove: () => void;
  onReject: () => void;
}

export interface OrderSearchProps {
  tenantId: string;
  /** Link to the order page, only for roles that can open it. */
  detailHref: (orderId: string) => string | undefined;
}

export interface PendingPaymentRowsProps {
  payments: BoardPendingPayment[];
  busyPaymentId: string | null;
  onConfirm: (paymentId: string) => void;
  onReject: (paymentId: string) => void;
}

export interface BoardAccordionProps {
  columns: BoardColumn[];
  renderOrder: (order: BoardOrder) => ReactNode;
}

export interface BoardRefreshButtonProps {
  refreshing: boolean;
  /** When the board last loaded (ms), or null before the first load. */
  updatedAt: number | null;
  intervalMs: number;
  onRefresh: () => void;
}

export interface CollectedSummaryCardProps {
  summary: CollectedSummary;
}

export interface StationTabsProps {
  tenantSlug: string;
  active: StationKey;
  /** Pending work per station, shown as a badge on its tab. */
  counts?: StationCounts;
}
