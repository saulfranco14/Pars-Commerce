"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import useSWR from "swr";
import { CalendarClock } from "lucide-react";

import { useMyDay } from "@/features/growth/hooks/useMyDay";
import { ColdLeadsSheet } from "@/features/growth/components/admin/ColdLeadsSheet";
import { TlacoAiCard } from "@/features/growth/components/admin/TlacoAiCard";

import { formatBusinessName } from "@/features/growth/helpers/formatBusinessName";
import { leadFiltersQuery } from "@/features/growth/helpers/leadFiltersQuery";
import { PROSPECTING_PATH } from "@/features/growth/constants/routes";
import { TODAY_STEP_TARGET } from "@/features/growth/constants/tlacoAi";
import { coldLeadsKey } from "@/features/growth/services/growthClient";
import { swrFetcher } from "@/lib/swrFetcher";

import type { ColdLead } from "@/features/growth/interfaces/cleanup";
import type { TodayCardProps } from "@/features/growth/interfaces/prospects";
import type { TodayFacts, TodayStepAction } from "@/features/growth/interfaces/tlacoAi";

const signalClass = "grid min-h-16 min-w-0 content-start gap-0.5 rounded-xl border px-2.5 py-2 text-left transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/50";

function todayLabel(): string {
  return new Intl.DateTimeFormat("es-MX", { weekday: "long", day: "numeric", month: "short", timeZone: "America/Mexico_City" }).format(new Date());
}

/** Tlaco IA's plan on its own card, then «Tu día»: how many to work today and how many are late, three signals that open their list, and the first-message goal. */
export function TodayCard({ board, onList }: TodayCardProps) {
  const { data: day } = useMyDay();
  const { data: cold } = useSWR<ColdLead[]>(coldLeadsKey(3, "me"), swrFetcher, { revalidateOnFocus: false });
  const [cleaning, setCleaning] = useState(false);
  const router = useRouter();
  const repliedLeads = board?.due.filter((lead) => lead.stage === "conversando") ?? [];
  const replied = repliedLeads.length;
  const hot = board?.due.filter((lead) => lead.stage === "caliente").length ?? 0;
  const coldCount = cold?.length ?? 0;
  const repliedName = replied === 1 ? formatBusinessName(repliedLeads[0].business_name) : null;
  const facts = useMemo<TodayFacts | null>(() => {
    if (!board || !day || !cold) return null;
    return { dueToday: board.counts.due_today, overdue: board.counts.overdue, replied, hot, cold: coldCount, sentToday: day.sent_today, dailyGoal: day.daily_goal, visitsToday: day.visits_today, repliedName };
  }, [board, day, cold, replied, hot, coldCount, repliedName]);
  if (!board) return null;

  const { counts } = board;
  const onStep = (action: TodayStepAction) => {
    const target = TODAY_STEP_TARGET[action];
    if ("list" in target) onList(target.list);
    else if ("sheet" in target) setCleaning(true);
    else router.push(target.path);
  };
  const urgent = replied ? "replied" : hot ? "hot" : coldCount ? "cold" : null;
  const goal = day ? Math.min(100, Math.round((day.sent_today / Math.max(day.daily_goal, 1)) * 100)) : 0;

  const signal = (key: typeof urgent, value: number, label: string, onClick: () => void) => (
    <button type="button" onClick={onClick} className={`${signalClass} ${key === urgent ? "border-accent/50 bg-accent/10" : "border-border bg-surface-raised hover:bg-border-soft/50"}`}>
      <strong className={`text-lg font-bold leading-tight tabular-nums ${key === urgent ? "text-accent" : "text-foreground"}`}>{value.toLocaleString("es-MX")}</strong>
      <span className="text-xs leading-snug text-muted-foreground">{label}</span>
    </button>
  );

  return (
    <div className="grid gap-3">
      <TlacoAiCard facts={facts} onStep={onStep} />
      <section className="grid gap-3 rounded-2xl border border-border bg-surface p-3.5" aria-label="Tu día">
        <div className="flex items-baseline justify-between gap-2">
          <h2 className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground">Tu día</h2>
          <span className="text-xs text-muted-foreground first-letter:uppercase">{todayLabel()}</span>
        </div>
        <p className="text-sm text-muted-foreground">
          <strong className="mr-1 text-3xl font-bold tracking-tight text-foreground tabular-nums">{counts.due_today.toLocaleString("es-MX")}</strong>
          por trabajar hoy
          {counts.overdue ? <> · <b className="text-red-600 dark:text-red-400">{counts.overdue.toLocaleString("es-MX")} vencidos</b></> : null}
        </p>
        <div className="grid grid-cols-3 gap-1.5">
          {signal("replied", replied, "respondió: contéstale", () => onList("conversando"))}
          {signal("hot", hot, "abrieron su tienda", () => onList("caliente"))}
          {signal("cold", coldCount, "no abrieron: limpiar", () => setCleaning(true))}
        </div>
        {day ? (
          <div className="grid gap-1">
            <div className="h-1.5 overflow-hidden rounded-full bg-border-soft" role="progressbar" aria-valuenow={day.sent_today} aria-valuemin={0} aria-valuemax={day.daily_goal} aria-label="Primeros mensajes de hoy">
              <div className="h-full rounded-full bg-accent transition-all" style={{ width: `${goal}%` }} />
            </div>
            <span className="text-xs text-muted-foreground">Primeros mensajes de hoy: <b className="text-foreground">{day.sent_today} de {day.daily_goal}</b></span>
          </div>
        ) : null}
        {day?.visits_today ? (
          <Link href={`${PROSPECTING_PATH}?${leadFiltersQuery({ lista: "cita" })}`} className="inline-flex w-fit items-center gap-2 rounded-xl bg-accent/10 px-3 py-2 text-sm font-semibold text-accent">
            <CalendarClock className="h-4 w-4" aria-hidden />Hoy tienes {day.visits_today === 1 ? "1 visita" : `${day.visits_today} visitas`}
          </Link>
        ) : null}
      </section>
      <ColdLeadsSheet isOpen={cleaning} onClose={() => setCleaning(false)} owner="me" />
    </div>
  );
}
