"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import useSWR from "swr";

import { swrFetcher } from "@/lib/swrFetcher";
import { buildQrCodesKey } from "@/features/qr/helpers/buildQrKey";

import type { QrCode } from "@/features/qr/interfaces/qrCode";

export type TableFilter = "all" | "free" | "occupied";

/**
 * Loads the list of "table" QR codes for the active tenant + provides
 * derived metrics (free / occupied counts) and a filter switch. The page
 * only renders — the data shape lives here.
 *
 * No background polling: occupied/free only changes on real staff/customer
 * actions (order paid, table closed), not every few seconds, so a fixed
 * interval either lags behind or refetches for nothing. Instead:
 *  - a forced revalidation on mount (bypassing the app-wide 10s dedupe, since
 *    coming BACK from a table's detail page — right after closing/paying it —
 *    is exactly the case a dedupe window would otherwise serve stale data for)
 *  - `refresh()` for an explicit manual check.
 */
export function useTablesList(tenantId: string | null) {
  const key = tenantId ? buildQrCodesKey(tenantId, "table") : null;
  const swr = useSWR<QrCode[]>(key, swrFetcher, { fallbackData: [] });

  const { mutate } = swr;
  const lastKeyRef = useRef<string | null>(null);
  useEffect(() => {
    if (!key || lastKeyRef.current === key) return;
    lastKeyRef.current = key;
    void mutate();
  }, [key, mutate]);

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
    /** True while a revalidation (mount check or manual refresh) is in flight. */
    isRefreshing: swr.isValidating,
    error: swr.error as Error | undefined,
    /** Manual "check now" — re-reads current_order_id without background polling. */
    refresh: () => swr.mutate(),
  };
}
