import { useState } from "react";
import useSWR from "swr";

import { funnelKey } from "@/features/growth/services/growthClient";
import { swrFetcher } from "@/lib/swrFetcher";

import type { FunnelReport } from "@/features/growth/interfaces/funnel";

export function useGrowthFunnel() {
  const [days, setDays] = useState(7);
  const { data, error, isLoading } = useSWR<FunnelReport>(funnelKey(days), swrFetcher, { keepPreviousData: true });
  return { report: data, error, isLoading, days, setDays };
}
