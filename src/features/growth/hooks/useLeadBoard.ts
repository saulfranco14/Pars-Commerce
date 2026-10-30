import useSWR from "swr";

import { boardKey } from "@/features/growth/services/growthClient";
import { swrFetcher } from "@/lib/swrFetcher";

import type { BoardZone, LeadBoard } from "@/features/growth/interfaces/lead";

export function useLeadBoard(zone: BoardZone) {
  return useSWR<LeadBoard>(boardKey(zone), swrFetcher, { keepPreviousData: true });
}
