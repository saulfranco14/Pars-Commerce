import type { StationKey } from "@/features/operaciones/constants/stations";

export function stationBoardKey(tenantId: string, station: StationKey): string {
  return `/api/operations/board?tenant_id=${encodeURIComponent(tenantId)}&station=${station}`;
}
