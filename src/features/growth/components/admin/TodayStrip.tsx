"use client";

import { useState } from "react";
import Link from "next/link";
import useSWR from "swr";
import { CalendarClock } from "lucide-react";

import { useMyDay } from "@/features/growth/hooks/useMyDay";
import { ColdLeadsSheet } from "@/features/growth/components/admin/ColdLeadsSheet";

import { leadFiltersQuery } from "@/features/growth/helpers/leadFiltersQuery";
import { PROSPECTING_PATH, SWEEP_PATH } from "@/features/growth/constants/routes";
import { coldLeadsKey } from "@/features/growth/services/growthClient";
import { swrFetcher } from "@/lib/swrFetcher";

import type { ColdLead } from "@/features/growth/interfaces/cleanup";
import type { LeadFilters } from "@/features/growth/interfaces/lead";

function listHref(filters: LeadFilters): string {
  return `${PROSPECTING_PATH}?${leadFiltersQuery({ vista: "contactar", owner: "me", ...filters })}`;
}

const tileClass = "grid min-h-20 content-start gap-0.5 rounded-2xl border px-3.5 py-3 text-left transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/50";

/** «Tu día» in one row of four numbers, the same on every tab, ordered by what brings a registration closest. */
export function TodayStrip() {
  const { data } = useMyDay();
  const { data: cold } = useSWR<ColdLead[]>(data ? coldLeadsKey(3, "me") : null, swrFetcher, { revalidateOnFocus: false });
  const [cleaning, setCleaning] = useState(false);
  if (!data) return <div className="h-20 animate-pulse rounded-2xl bg-border-soft/50" aria-hidden />;

  const coldCount = cold?.length ?? 0;
  const urgent = data.replied_due ? 0 : data.hot_due ? 1 : coldCount ? 2 : 3;
  const tile = (index: number) => `${tileClass} ${index === urgent ? "border-accent bg-accent/8" : "border-border bg-surface hover:bg-surface-raised"}`;
  const number = (value: string, index: number) => <strong className={`text-2xl font-bold tracking-tight tabular-nums ${index === urgent ? "text-accent" : "text-foreground"}`}>{value}</strong>;

  return (
    <div className="grid gap-2">
      <div className="grid grid-cols-2 gap-2 lg:grid-cols-4" aria-label="Tu día">
        <Link href={listHref({ stage: "conversando" })} className={tile(0)}>
          {number(String(data.replied_due), 0)}
          <span className="text-xs text-muted-foreground">Contestar a quien respondió</span>
        </Link>
        <Link href={listHref({ stage: "caliente" })} className={tile(1)}>
          {number(String(data.hot_due), 1)}
          <span className="text-xs text-muted-foreground">Abrieron su tienda: escríbeles hoy</span>
        </Link>
        <button type="button" onClick={() => setCleaning(true)} className={tile(2)}>
          {number(coldCount.toLocaleString("es-MX"), 2)}
          <span className="text-xs text-muted-foreground">Limpiar: no abrieron su tienda</span>
        </button>
        <Link href={SWEEP_PATH} className={tile(3)}>
          {number(`${data.sent_today}/${data.daily_goal}`, 3)}
          <span className="text-xs text-muted-foreground">Primeros mensajes de hoy</span>
        </Link>
      </div>
      {data.visits_today ? (
        <Link href={listHref({ stage: "cita" })} className="inline-flex w-fit items-center gap-2 rounded-xl bg-accent/10 px-3 py-2 text-sm font-semibold text-accent">
          <CalendarClock className="h-4 w-4" aria-hidden />Hoy tienes {data.visits_today === 1 ? "1 visita" : `${data.visits_today} visitas`}
        </Link>
      ) : null}
      <ColdLeadsSheet isOpen={cleaning} onClose={() => setCleaning(false)} owner="me" />
    </div>
  );
}
