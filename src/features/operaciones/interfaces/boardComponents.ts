import type { ReactNode } from "react";

import type { StationBoardController } from "@/features/operaciones/hooks/useStationBoard";
import type { StationKey, StationMeta } from "@/features/operaciones/constants/stations";
import type { BoardOrder, BoardTeamMember } from "@/features/operaciones/interfaces/board";

export interface StationBoardViewProps {
  station: StationMeta;
  tenantId: string;
  tenantSlug: string;
}

export interface BoardOrderCardProps {
  order: BoardOrder;
  now: number;
  /** Only for roles that can open the order detail. */
  detailHref?: string;
  showTimer?: boolean;
  children?: ReactNode;
}

export interface StationCardActionsProps {
  station: StationKey;
  order: BoardOrder;
  board: StationBoardController;
  team: BoardTeamMember[];
  canPrepare: boolean;
  detailHref?: string;
  onDeliver: (order: BoardOrder) => void;
  onReject: (order: BoardOrder) => void;
}

export interface StationTabsProps {
  tenantSlug: string;
  active: StationKey;
}
