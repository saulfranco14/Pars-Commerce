"use client";

import Link from "next/link";

import { useCanOpenSection } from "@/stores/useTenantStore";

import { STATIONS, stationSection } from "@/features/operaciones/constants/stations";

import type { StationTabsProps } from "@/features/operaciones/interfaces/boardComponents";

// Every station fits on one row at any width: no sideways scrolling, nothing cut off.
const COLUMNS: Record<number, string> = {
  2: "grid-cols-2",
  3: "grid-cols-3",
  4: "grid-cols-4",
  5: "grid-cols-5",
};

/** Only the stations this role can open; hidden when there is just one. */
export function StationTabs({ tenantSlug, active, counts = {} }: StationTabsProps) {
  const canOpen = useCanOpenSection();
  const stations = STATIONS.filter((s) => canOpen(stationSection(s.key)));
  if (stations.length < 2) return null;

  return (
    <nav
      aria-label="Estaciones"
      className={`grid gap-1 rounded-2xl border border-border bg-surface p-1 shadow-sm ${COLUMNS[stations.length] ?? "grid-cols-5"}`}
    >
      {stations.map((s) => {
        const Icon = s.icon;
        const isActive = s.key === active;
        const pending = counts[s.key] ?? 0;
        return (
          <Link
            key={s.key}
            href={`/dashboard/${tenantSlug}/operacion/${s.key}`}
            aria-current={isActive ? "page" : undefined}
            aria-label={pending > 0 ? `${s.label}, ${pending} pendientes` : s.label}
            className={`relative flex min-h-14 min-w-0 flex-col items-center justify-center gap-1 rounded-xl px-1 py-1.5 text-center transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent sm:min-h-11 sm:flex-row sm:gap-2 sm:px-3 ${
              isActive
                ? "bg-accent text-accent-foreground shadow-sm"
                : "text-muted-foreground hover:bg-border-soft/60 hover:text-foreground"
            }`}
          >
            <Icon className="h-5 w-5 shrink-0 sm:h-4 sm:w-4" aria-hidden />
            <span className="w-full truncate text-[11px] font-semibold leading-tight tracking-tight sm:w-auto sm:text-sm">{s.label}</span>
            {pending > 0 && (
              <span
                aria-hidden
                className="absolute top-1 right-1 flex h-4.5 min-w-4.5 items-center justify-center rounded-full bg-red-500 px-1 text-[10px] font-bold leading-none text-white tabular-nums sm:static sm:h-5 sm:min-w-5 sm:text-[11px]"
              >
                {pending > 99 ? "99+" : pending}
              </span>
            )}
          </Link>
        );
      })}
    </nav>
  );
}
