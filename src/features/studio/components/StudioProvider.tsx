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
            className="flex flex-wrap gap-1 border-b border-border-soft pb-3"
          >
            {[
              { path: "", label: "Studio" },
              { path: "/disenos", label: "Mis diseños" },
              { path: "/publicaciones", label: "Publicaciones" },
              { path: "/tlacos", label: "Membresía y Tlacos" },
              { path: "/configuracion", label: "Marca" },
            ].map((item) => (
              <Link
                key={item.path}
                href={`${base}${item.path}`}
                aria-current={
                  pathname === `${base}${item.path}` ? "page" : undefined
                }
                className={`inline-flex min-h-11 items-center rounded-xl px-3 text-sm font-semibold ${pathname === `${base}${item.path}` ? "bg-accent/10 text-accent" : "text-muted-foreground hover:bg-border-soft"}`}
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
