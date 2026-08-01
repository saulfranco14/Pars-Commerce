"use client";

import useSWR from "swr";

import { swrFetcher } from "@/lib/swrFetcher";

import type { ActiveTableSummary } from "@/app/api/qr/tables/active/route";

interface UseActiveTablesOptions {
  refreshIntervalMs?: number;
}

export function useActiveTables(
  tenantId: string | null,
  options: UseActiveTablesOptions = {},
) {
  const refreshInterval = options.refreshIntervalMs ?? 10000;
  const key = tenantId
    ? `/api/qr/tables/active?tenant_id=${encodeURIComponent(tenantId)}`
    : null;

  const swr = useSWR<ActiveTableSummary[]>(key, swrFetcher, {
    fallbackData: [],
    refreshInterval,
  });

  return {
    tables: swr.data ?? [],
    isLoading: swr.isLoading,
    error: swr.error as Error | undefined,
  };
}
