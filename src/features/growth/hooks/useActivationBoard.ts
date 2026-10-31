import useSWR from "swr";

import { activationKey } from "@/features/growth/services/growthClient";
import { swrFetcher } from "@/lib/swrFetcher";

import type { ActivationColumn } from "@/features/growth/interfaces/activation";

export function useActivationBoard(owner?: string) {
  return useSWR<ActivationColumn[]>(activationKey(owner), swrFetcher, { keepPreviousData: true });
}
