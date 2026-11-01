import { useEffect } from "react";
import useSWR from "swr";

import { useProspectFilters } from "@/features/growth/hooks/useProspectFilters";

import { leadFiltersQuery } from "@/features/growth/helpers/leadFiltersQuery";
import { leadsKey } from "@/features/growth/services/growthClient";
import { rememberLeadsList } from "@/features/growth/services/leadsReturn";
import { swrFetcher } from "@/lib/swrFetcher";

import type { LeadListResult } from "@/features/growth/interfaces/lead";

/** «Prospectar» list: the shared header owns search and filters; this adds the stage, the page and the data. */
export function useGrowthLeads() {
  const { filters, update } = useProspectFilters();
  const query = leadFiltersQuery(filters);
  const { data, error, isLoading } = useSWR<LeadListResult>(leadsKey(filters), swrFetcher, { keepPreviousData: true });

  useEffect(() => {
    rememberLeadsList(query);
  }, [query]);

  const active = Boolean(filters.q || filters.municipio || filters.giro || filters.contact || filters.owner);
  return { data, error, isLoading, filters, update, active };
}
