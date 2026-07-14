"use client";

import useSWR from "swr";

import { swrFetcher } from "@/lib/swrFetcher";

import type { ActiveTableSummary } from "@/app/api/qr/tables/active/route";

interface UseActiveTablesOptions {
  refreshIntervalMs?: number;
}

/**
 * Tables (QR codes) that currently have a customer connected — for the
 * dashboard home's "mesas activas" widget. Empty array when none are active,
 * so the widget can hide itself entirely rather than show an empty state.
 */
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
