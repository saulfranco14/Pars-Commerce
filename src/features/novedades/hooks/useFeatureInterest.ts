import useSWR from "swr";

import { swrFetcher } from "@/lib/swrFetcher";

interface InterestResponse {
  interested: string[];
}

/** Qué novedades ya marcó "me interesa" este negocio. */
export function useFeatureInterest(tenantId: string | null) {
  const key = tenantId
    ? `/api/feature-interest?tenant_id=${encodeURIComponent(tenantId)}`
    : null;
  const { data, isLoading, mutate } = useSWR<InterestResponse>(
    key,
    swrFetcher,
  );
  return {
    interested: data?.interested ?? [],
    isLoading,
    mutate,
  };
}
