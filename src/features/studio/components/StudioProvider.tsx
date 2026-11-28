"use client";

import { createContext, useContext, useEffect } from "react";
import useSWR from "swr";
import { usePathname } from "next/navigation";
import {
  loadStudioSummary,
  studioSummaryKey,
} from "../services/studioClientService";
import { useStudioTelemetry } from "../hooks/useStudioTelemetry";
import { markStudioSeen } from "../hooks/useStudioSeen";
import { StudioNav } from "./StudioNav";
import type { StudioSummary } from "../interfaces/studio";
import type { StudioContextValue, StudioScope } from "../interfaces/ui";

const StudioContext = createContext<StudioContextValue | null>(null);
export function StudioProvider({
  tenantId,
  tenantSlug,
  tenantName,
  userId,
  children,
}: StudioScope) {
  const pathname = usePathname();
  const { data, error, isLoading, mutate } = useSWR(
    [studioSummaryKey(tenantId), userId],
    () => loadStudioSummary(tenantId),
    {
      revalidateOnFocus: true,
      refreshInterval: (value: StudioSummary | undefined) =>
        value?.active
          ? 30_000
          : value?.membership?.status === "pending_payment"
            ? 8000
            : 0,
    },
  );
  useStudioTelemetry(tenantId, data);
  useEffect(markStudioSeen, []);
  const editing =
    pathname.includes("/nuevo") || /\/disenos\/[^/]+/.test(pathname);
  return (
    <StudioContext
      value={{
        tenantId,
        tenantSlug,
        tenantName,
        userId,
        summary: data,
        error,
        isLoading,
        refresh: () => mutate(),
      }}
    >
      <div className="mx-auto w-full max-w-7xl space-y-5">
        {!editing && <StudioNav />}
        {children}
      </div>
    </StudioContext>
  );
}
export function useStudioContext(): StudioContextValue {
  const value = useContext(StudioContext);
  if (!value) throw new Error("Studio scope is missing");
  return value;
}
