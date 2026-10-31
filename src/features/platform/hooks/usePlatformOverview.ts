import useSWR from "swr";

import { swrFetcher } from "@/lib/swrFetcher";

import type { OperationHealth, PlatformOverview } from "@/features/platform/interfaces/overview";

export function usePlatformOverview(days: number) {
  const overview = useSWR<PlatformOverview>(`/api/platform/overview?days=${days}`, swrFetcher, { keepPreviousData: true });
  const health = useSWR<OperationHealth>("/api/platform/operation-health", swrFetcher);
  return { overview: overview.data, health: health.data, error: overview.error, isLoading: overview.isLoading };
}
