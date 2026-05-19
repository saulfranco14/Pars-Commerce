"use client";

import { useEffect, useMemo, useRef, useState } from "react";

import type { MenuItem } from "@/features/qr/interfaces/tableCart";

interface UseMenuFilterParams {
  products: MenuItem[];
  /** How many products to render initially / per chunk. Defaults to 30. */
  pageSize?: number;
}

interface UseMenuFilterResult {
  query: string;
  setQuery: (value: string) => void;
  filtered: MenuItem[];
  visible: MenuItem[];
  visibleCount: number;
  totalCount: number;
  hasMore: boolean;
  sentinelRef: React.RefObject<HTMLDivElement | null>;
}

/**
 * Manages the menu's filter (case-insensitive substring match on name) and
 * chunked rendering so the DOM stays light even when the tenant has
 * thousands of products. Reveals the next chunk when a sentinel element
 * scrolls into view (IntersectionObserver — no extra deps).
 *
 * Components consume `visible` for the grid render and attach `sentinelRef`
 * to a small div placed below the grid.
 */
export function useMenuFilter({
  products,
  pageSize = 30,
}: UseMenuFilterParams): UseMenuFilterResult {
  const [query, setQuery] = useState("");
  const [page, setPage] = useState(1);
  const sentinelRef = useRef<HTMLDivElement | null>(null);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return products;
    return products.filter((p) => p.name.toLowerCase().includes(q));
  }, [products, query]);

  // Reset pagination when the filter narrows the list.
  useEffect(() => {
    setPage(1);
  }, [query, products.length]);

  const visibleCount = Math.min(page * pageSize, filtered.length);
  const visible = useMemo(
    () => filtered.slice(0, visibleCount),
    [filtered, visibleCount],
  );
  const hasMore = visibleCount < filtered.length;

  useEffect(() => {
    if (!hasMore) return;
    const node = sentinelRef.current;
    if (!node) return;

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries.some((e) => e.isIntersecting)) {
          setPage((p) => p + 1);
        }
      },
      { rootMargin: "200px" },
    );
    observer.observe(node);
    return () => observer.disconnect();
  }, [hasMore, visibleCount]);

  return {
    query,
    setQuery,
    filtered,
    visible,
    visibleCount,
    totalCount: products.length,
    hasMore,
    sentinelRef,
  };
}
