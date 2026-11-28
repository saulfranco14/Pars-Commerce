"use client";

import useSWR from "swr";

import { useActiveTenant } from "@/stores/useTenantStore";

import { swrFetcher } from "@/lib/swrFetcher";

import type { ZoneReport } from "@/features/growth/interfaces/zoneReport";

export const zoneReportKey = (tenantId: string) => `/api/tenants/${tenantId}/zone-report`;

export function useZoneReport() {
  const tenant = useActiveTenant();
  const { data, error, isLoading } = useSWR<ZoneReport>(tenant ? zoneReportKey(tenant.id) : null, swrFetcher, { shouldRetryOnError: false, revalidateOnFocus: false });
  return { tenant, report: data, error, isLoading: isLoading || !tenant };
}
