"use client";

import { useState, useRef } from "react";
import useSWR from "swr";
import { swrFetcher } from "@/lib/swrFetcher";
import type { Customer } from "@/types/customers";

export function useCustomerSearch(activeTenantId: string) {
  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  function handleSearchChange(value: string) {
    setSearch(value);
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => setDebouncedSearch(value), 300);
  }

  function resetSearch() {
    setSearch("");
    setDebouncedSearch("");
  }

  const customersKey =
    debouncedSearch.length >= 1
      ? `/api/customers?tenant_id=${activeTenantId}&search=${encodeURIComponent(debouncedSearch)}`
      : null;

  const { data } = useSWR<Customer[]>(customersKey, swrFetcher, {
    fallbackData: [],
    revalidateOnFocus: false,
  });

  const results = Array.isArray(data) ? data : [];

  return { search, debouncedSearch, results, handleSearchChange, resetSearch };
}
