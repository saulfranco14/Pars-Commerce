"use client";

import { useEffect, useState } from "react";
import useSWR from "swr";

import { swrFetcher } from "@/lib/swrFetcher";
import { orderSearchKey } from "@/features/operaciones/helpers/boardKey";

import type { OrderSearchResult } from "@/features/operaciones/interfaces/board";

const DEBOUNCE_MS = 300;
const MIN_LENGTH = 2;

/** Search as you type, waiting a beat so each keystroke isn't a request. */
export function useOrderSearch(tenantId: string | null) {
  const [query, setQuery] = useState("");
  const [settled, setSettled] = useState("");

  useEffect(() => {
    const id = setTimeout(() => setSettled(query.trim()), DEBOUNCE_MS);
    return () => clearTimeout(id);
  }, [query]);

  const active = Boolean(tenantId) && settled.length >= MIN_LENGTH;
  const { data, error, isLoading } = useSWR<OrderSearchResult[]>(
    active && tenantId ? orderSearchKey(tenantId, settled) : null,
    swrFetcher,
    { keepPreviousData: true },
  );

  return {
    query,
    setQuery,
    clear: () => setQuery(""),
    active,
    searching: active && isLoading,
    results: active ? (data ?? []) : [],
    error: error instanceof Error ? error.message : error ? "No se pudo buscar." : null,
  };
}
