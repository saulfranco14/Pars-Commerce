"use client";

import Link from "next/link";

import { useCanOpenSection } from "@/stores/useTenantStore";

import { STATIONS, stationSection } from "@/features/operaciones/constants/stations";

import type { StationTabsProps } from "@/features/operaciones/interfaces/boardComponents";

/** Only the stations this role can open; hidden when there is just one. */
export function StationTabs({ tenantSlug, active }: StationTabsProps) {
  const canOpen = useCanOpenSection();
  const stations = STATIONS.filter((s) => canOpen(stationSection(s.key)));
  if (stations.length < 2) return null;

  return (
    <nav aria-label="Estaciones" className="-mx-1 flex gap-2 overflow-x-auto px-1 pb-1">
      {stations.map((s) => {
        const Icon = s.icon;
        const isActive = s.key === active;
        return (
          <Link
            key={s.key}
            href={`/dashboard/${tenantSlug}/operacion/${s.key}`}
            aria-current={isActive ? "page" : undefined}
            className={`inline-flex min-h-11 shrink-0 items-center gap-2 rounded-xl border px-4 text-sm font-semibold transition-colors ${
              isActive
                ? "border-accent bg-accent text-accent-foreground"
                : "border-border bg-surface text-muted-foreground hover:text-foreground"
            }`}
          >
            <Icon className="h-4 w-4" aria-hidden />
            {s.label}
          </Link>
        );
      })}
    </nav>
  );
}
