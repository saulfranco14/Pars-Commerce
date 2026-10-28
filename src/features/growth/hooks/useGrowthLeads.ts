import { useEffect, useRef, useState } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import useSWR from "swr";

import { leadFiltersQuery, parseLeadFilters } from "@/features/growth/helpers/leadFiltersQuery";
import { leadsKey } from "@/features/growth/services/growthClient";
import { rememberLeadsList } from "@/features/growth/services/leadsReturn";
import { swrFetcher } from "@/lib/swrFetcher";

import type { LeadFilters, LeadListResult } from "@/features/growth/interfaces/lead";

const SEARCH_DEBOUNCE_MS = 300;

export function useGrowthLeads() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const filters = parseLeadFilters(searchParams);
  const query = leadFiltersQuery(filters);
  const [search, setSearch] = useState(filters.q ?? "");
  const { data, error, isLoading } = useSWR<LeadListResult>(leadsKey(filters), swrFetcher, { keepPreviousData: true });

  // The debounced search reads the latest filters, not the ones from when the user started typing.
  const latest = useRef(filters);
  useEffect(() => {
    latest.current = filters;
    rememberLeadsList(query);
  });

  function navigate(next: LeadFilters) {
    const nextQuery = leadFiltersQuery(next);
    router.replace(nextQuery ? `${pathname}?${nextQuery}` : pathname, { scroll: false });
  }

  function update(patch: Partial<LeadFilters>) {
    navigate({ ...filters, ...patch, page: patch.page ?? 1 });
  }

  // Typing stays instant; the URL (and the request) follow once the operator pauses.
  useEffect(() => {
    const timer = setTimeout(() => {
      const term = search.trim();
      if (term === (latest.current.q ?? "")) return;
      navigate({ ...latest.current, q: term || undefined, page: 1 });
    }, SEARCH_DEBOUNCE_MS);
    return () => clearTimeout(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps -- only the typed text schedules a search
  }, [search]);

  const active = query !== "";
  function clear() {
    setSearch("");
    navigate({ vista: "contactar", page: 1 });
  }

  return { data, error, isLoading, filters, update, search, changeSearch: setSearch, active, clear };
}
