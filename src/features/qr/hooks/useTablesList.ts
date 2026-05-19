"use client";

import { useMemo, useState } from "react";
import useSWR from "swr";

import { swrFetcher } from "@/lib/swrFetcher";
import { buildQrCodesKey } from "@/features/qr/helpers/buildQrKey";

import type { QrCode } from "@/features/qr/interfaces/qrCode";

export type TableFilter = "all" | "free" | "occupied";

interface UseTablesListOptions {
  refreshIntervalMs?: number;
}

/**
 * Loads the list of "table" QR codes for the active tenant + provides
 * derived metrics (free / occupied counts) and a filter switch. The page
 * only renders — the data shape lives here.
 */
export function useTablesList(
  tenantId: string | null,
  options: UseTablesListOptions = {},
) {
  const refreshInterval = options.refreshIntervalMs ?? 8000;
  const key = tenantId ? buildQrCodesKey(tenantId, "table") : null;
  const swr = useSWR<QrCode[]>(key, swrFetcher, {
    fallbackData: [],
    refreshInterval,
  });

  const [filter, setFilter] = useState<TableFilter>("all");

  const all = swr.data ?? [];
  const metrics = useMemo(() => {
    const total = all.length;
    const occupied = all.filter((t) => !!t.current_order_id).length;
    const free = total - occupied;
    return { total, occupied, free };
  }, [all]);

  const filtered = useMemo(() => {
    if (filter === "free") return all.filter((t) => !t.current_order_id);
    if (filter === "occupied") return all.filter((t) => !!t.current_order_id);
    return all;
  }, [all, filter]);

  return {
    tables: all,
    filtered,
    metrics,
    filter,
    setFilter,
    isLoading: swr.isLoading,
    error: swr.error as Error | undefined,
    mutate: swr.mutate,
  };
}
