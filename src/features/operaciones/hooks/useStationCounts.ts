"use client";

import useSWR from "swr";

import { swrFetcher } from "@/lib/swrFetcher";
import { BOARD_REFRESH_MS } from "@/features/operaciones/constants/stations";
import { stationCountsKey } from "@/features/operaciones/helpers/boardKey";

import type { StationCounts } from "@/features/operaciones/interfaces/board";

/** Pending work per station for the tabs; any board action refreshes it too. */
export function useStationCounts(tenantId: string | null): StationCounts {
  const { data } = useSWR<StationCounts>(tenantId ? stationCountsKey(tenantId) : null, swrFetcher, {
    refreshInterval: BOARD_REFRESH_MS,
    revalidateOnFocus: true,
    keepPreviousData: true,
  });
  return data ?? {};
}
