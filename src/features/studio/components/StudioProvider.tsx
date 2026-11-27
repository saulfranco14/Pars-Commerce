"use client";

import { createContext, useContext } from "react";
import useSWR from "swr";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  loadStudioSummary,
  studioSummaryKey,
} from "../services/studioClientService";
import { useStudioTelemetry } from "../hooks/useStudioTelemetry";
import { STUDIO_NAV } from "../constants/studio";
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
  const base = `/dashboard/${tenantSlug}/studio`;
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
        {!editing && (
          <nav
            aria-label="Tlaco Studio"
            className="grid grid-cols-4 gap-1 rounded-xl bg-border-soft/70 p-1"
          >
            {STUDIO_NAV.map((item) => (
              <Link
                key={item.path}
                href={`${base}${item.path}`}
                aria-current={
                  pathname === `${base}${item.path}` ? "page" : undefined
                }
                className={`inline-flex min-h-10 min-w-0 items-center justify-center truncate rounded-lg px-1 text-sm font-bold transition-colors focus-visible:outline-2 focus-visible:outline-accent ${pathname === `${base}${item.path}` ? "bg-surface text-foreground shadow-sm" : "text-muted-foreground hover:text-foreground"}`}
              >
                {item.label}
              </Link>
            ))}
          </nav>
        )}
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
