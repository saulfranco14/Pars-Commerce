import useSWR from "swr";

import { swrFetcher } from "@/lib/swrFetcher";
import type {
  SettlementsResponse,
  SettlementConfigResponse,
} from "@/types/settlement";

/** Liquidaciones del negocio + su config de ciclo, con SWR. */
export function useSettlements(tenantId: string | null) {
  const key = tenantId
    ? `/api/settlements?tenant_id=${encodeURIComponent(tenantId)}`
    : null;
  const { data, error, isLoading, mutate } = useSWR<SettlementsResponse>(
    key,
    swrFetcher,
  );
  return { data, error, isLoading, mutate };
}

export function useSettlementConfig(tenantId: string | null) {
  const key = tenantId
    ? `/api/settlement-config?tenant_id=${encodeURIComponent(tenantId)}`
    : null;
  const { data, error, isLoading, mutate } =
    useSWR<SettlementConfigResponse>(key, swrFetcher);
  return { data, error, isLoading, mutate };
}
