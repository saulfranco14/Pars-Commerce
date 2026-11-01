import { useEffect, useRef, useState } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";

import { leadFiltersQuery, parseLeadFilters } from "@/features/growth/helpers/leadFiltersQuery";

import type { LeadFilters } from "@/features/growth/interfaces/lead";

const SEARCH_DEBOUNCE_MS = 300;

/** The filters and search every Prospectos tab shares; they live in the URL so a reload or the back button keeps them. */
export function useProspectFilters() {
  const router = useRouter();
  const pathname = usePathname();
  const filters = parseLeadFilters(useSearchParams());
  const [search, setSearch] = useState(filters.q ?? "");
  const latest = useRef(filters);

  useEffect(() => {
    latest.current = filters;
  });

  function navigate(next: LeadFilters) {
    const query = leadFiltersQuery(next);
    router.replace(query ? `${pathname}?${query}` : pathname, { scroll: false });
  }

  // Typing stays instant; the URL, and every tab's request, follow once the person pauses.
  useEffect(() => {
    const timer = setTimeout(() => {
      const term = search.trim();
      if (term === (latest.current.q ?? "")) return;
      navigate({ ...latest.current, q: term || undefined, page: 1 });
    }, SEARCH_DEBOUNCE_MS);
    return () => clearTimeout(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps -- only the typed text schedules a search
  }, [search]);

  return {
    filters,
    search,
    setSearch,
    update: (patch: Partial<LeadFilters>) => navigate({ ...filters, ...patch, page: patch.page ?? 1 }),
    /** Search and filters off, staying on the same tab. */
    clear: () => {
      setSearch("");
      navigate({ vista: filters.vista });
    },
  };
}
