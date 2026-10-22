import type { StationKey } from "@/features/operaciones/constants/stations";
import type { BoardView } from "@/features/operaciones/interfaces/board";

export function stationBoardKey(tenantId: string, station: StationKey, view: BoardView = "active"): string {
  return `/api/operations/board?tenant_id=${encodeURIComponent(tenantId)}&station=${station}&view=${view}`;
}

export function stationCountsKey(tenantId: string): string {
  return `/api/operations/counts?tenant_id=${encodeURIComponent(tenantId)}`;
}

export function orderSearchKey(tenantId: string, query: string): string {
  return `/api/operations/search?tenant_id=${encodeURIComponent(tenantId)}&q=${encodeURIComponent(query)}`;
}
