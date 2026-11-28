"use client";

import useSWR from "swr";

import { swrFetcher } from "@/lib/swrFetcher";

import type { OutsideContext, WeekReport } from "@/features/ventas/interfaces/weekReport";

export const weekReportKey = (tenantId: string) => `/api/tenants/${tenantId}/week-report`;
export const outsideContextKey = (tenantId: string) => `/api/tenants/${tenantId}/week-report/outside`;

/** The week numbers load at once; the search outside is slower and arrives on its own. */
export function useWeekReport(tenantId: string | null) {
  const report = useSWR<WeekReport>(tenantId ? weekReportKey(tenantId) : null, swrFetcher, { revalidateOnFocus: false });
  const outside = useSWR<OutsideContext>(tenantId && report.data ? outsideContextKey(tenantId) : null, swrFetcher, {
    revalidateOnFocus: false,
    shouldRetryOnError: false,
  });
  return {
    report: report.data,
    reportError: report.error as Error | undefined,
    reportLoading: report.isLoading,
    outside: outside.data,
    outsideError: outside.error as Error | undefined,
    outsideLoading: outside.isLoading,
  };
}
