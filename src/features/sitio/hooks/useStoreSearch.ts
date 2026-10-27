"use client";

import { useEffect, useState } from "react";
import useSWR from "swr";

import { SEARCH_MIN_CHARS } from "@/features/sitio/constants/catalog";
import { searchStore } from "@/features/sitio/services/storefrontClientService";

// Phone typing lands ~200ms apart; a shorter wait fired one request per letter.
const DEBOUNCE_MS = 320;

export function useStoreSearch({ slug }: { slug: string }) {
  const [query, setQuery] = useState("");
  const [debounced, setDebounced] = useState("");

  useEffect(() => {
    const timer = window.setTimeout(() => setDebounced(query.trim()), DEBOUNCE_MS);
    return () => window.clearTimeout(timer);
  }, [query]);

  const active = debounced.length >= SEARCH_MIN_CHARS;
  const { data, error, isLoading } = useSWR(
    active ? (["store-search", slug, debounced] as const) : null,
    ([, storeSlug, term]) => searchStore({ slug: storeSlug, query: term }),
    { keepPreviousData: true, revalidateOnFocus: false, dedupingInterval: 30_000 },
  );

  return {
    query,
    setQuery,
    results: active ? (data ?? []) : [],
    isSearching: active && (isLoading || debounced !== query.trim()),
    hasQuery: active,
    error: error as Error | undefined,
  };
}
