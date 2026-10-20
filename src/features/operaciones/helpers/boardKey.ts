import type { StationKey } from "@/features/operaciones/constants/stations";
import type { BoardView } from "@/features/operaciones/interfaces/board";

export function stationBoardKey(tenantId: string, station: StationKey, view: BoardView = "active"): string {
  return `/api/operations/board?tenant_id=${encodeURIComponent(tenantId)}&station=${station}&view=${view}`;
}
