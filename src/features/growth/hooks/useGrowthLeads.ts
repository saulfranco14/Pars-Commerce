import { useDeferredValue, useState } from "react";
import useSWR from "swr";

import { leadsKey } from "@/features/growth/services/growthClient";
import { swrFetcher } from "@/lib/swrFetcher";

import type { LeadFilters, LeadListResult } from "@/features/growth/interfaces/lead";

export function useGrowthLeads() {
  const [filters, setFilters] = useState<LeadFilters>({ stage: "todos", page: 1 });
  const [search, setSearch] = useState("");
  const q = useDeferredValue(search.trim());
  const { data, error, isLoading } = useSWR<LeadListResult>(leadsKey({ ...filters, q }), swrFetcher, { keepPreviousData: true });

  function update(patch: Partial<LeadFilters>) {
    setFilters((current) => ({ ...current, ...patch, page: patch.page ?? 1 }));
  }

  function changeSearch(value: string) {
    setSearch(value);
    setFilters((current) => ({ ...current, page: 1 }));
  }

  return { data, error, isLoading, filters, update, search, changeSearch };
}
