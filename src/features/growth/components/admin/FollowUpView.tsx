"use client";

import { useState } from "react";
import { AlertTriangle, CalendarClock, PauseCircle, Sparkles } from "lucide-react";

import { useLeadBoard } from "@/features/growth/hooks/useLeadBoard";
import { EmptyState } from "@/components/admin/EmptyState";
import { FilterTabs } from "@/components/ui/FilterTabs";
import { LoadingBlock } from "@/components/ui/LoadingBlock";
import { BoardLeadCard } from "@/features/growth/components/admin/BoardLeadCard";

import { nextStepDue } from "@/features/growth/helpers/leadPipeline";
import { PIPELINE_STEPS } from "@/features/growth/constants/leadPipeline";

import type { BoardColumnKey } from "@/features/growth/interfaces/lead";
import type { FollowUpViewProps } from "@/features/growth/interfaces/pipeline";

type MobileTab = BoardColumnKey | "hoy";

const COLUMN_LABEL = Object.fromEntries(PIPELINE_STEPS.map((step) => [step.key, step.label])) as Record<BoardColumnKey, string>;

/** Daily follow-up: a board per stage on wide screens, one stage at a time on phones. */
export function FollowUpView({ filters, showOwner }: FollowUpViewProps) {
  const { data, error, isLoading } = useLeadBoard({ municipio: filters.municipio, giro: filters.giro, owner: filters.owner });
  const [mobileTab, setMobileTab] = useState<MobileTab>("hoy");
  const now = new Date();

  if (isLoading && !data) return <LoadingBlock message="Cargando seguimiento…" variant="skeleton" />;
  if (error && !data) return <EmptyState icon={AlertTriangle} title="No pudimos cargar el seguimiento" description="Intenta de nuevo en un momento." tone="muted" />;
  if (!data) return null;

  const { columns, counts } = data;
  const dueToday = columns.flatMap((column) => column.leads).filter((lead) => {
    const tone = nextStepDue(lead, now)?.tone;
    return tone === "danger" || tone === "warning";
  });
  const mobileLeads = mobileTab === "hoy" ? dueToday : columns.find((column) => column.key === mobileTab)?.leads ?? [];

  return (
    <div className="grid grid-cols-1 gap-4">
      <ul className="flex flex-wrap items-center gap-x-5 gap-y-1 text-sm text-muted-foreground" aria-label="Resumen de hoy">
        <li className="inline-flex items-center gap-1.5"><CalendarClock className="h-4 w-4 text-amber-600" aria-hidden /><b className="text-foreground">{counts.due_today}</b> para hoy</li>
        <li className="inline-flex items-center gap-1.5"><AlertTriangle className="h-4 w-4 text-red-600" aria-hidden /><b className="text-foreground">{counts.overdue}</b> vencidos</li>
        <li className="inline-flex items-center gap-1.5"><PauseCircle className="h-4 w-4 text-muted-foreground" aria-hidden /><b className="text-foreground">{counts.paused}</b> en pausa</li>
        <li className="inline-flex items-center gap-1.5"><Sparkles className="h-4 w-4 text-emerald-600" aria-hidden /><b className="text-foreground">{counts.registrado}</b> registrados</li>
      </ul>

      <div className="lg:hidden">
        <FilterTabs
          tabs={[
            { value: "hoy", label: `Para hoy ${dueToday.length}` },
            ...columns.map((column) => ({ value: column.key, label: `${COLUMN_LABEL[column.key]} ${column.total}` })),
          ]}
          activeValue={mobileTab}
          onTabChange={(value) => setMobileTab(value as MobileTab)}
          ariaLabel="Etapa"
        />
        <div className="mt-3 grid gap-2">
          {mobileLeads.length ? (
            mobileLeads.map((lead) => <BoardLeadCard key={lead.id} lead={lead} now={now} showOwner={showOwner} />)
          ) : (
            <EmptyState icon={CalendarClock} title={mobileTab === "hoy" ? "Nada pendiente para hoy" : "Nadie en esta etapa"} description={mobileTab === "hoy" ? "Manda primeros mensajes desde «Prospectar»." : undefined} tone="muted" />
          )}
        </div>
      </div>

      <div className="hidden gap-3 lg:grid lg:grid-cols-5">
        {columns.map((column) => (
          <section key={column.key} className="flex min-w-0 flex-col rounded-2xl border border-border bg-surface-raised/60" aria-label={COLUMN_LABEL[column.key]}>
            <header className="flex items-center justify-between gap-2 border-b border-border-soft px-3 py-2.5">
              <h3 className="truncate text-sm font-bold text-foreground">{COLUMN_LABEL[column.key]}</h3>
              <span className="rounded-full bg-border-soft px-2 py-0.5 text-xs font-bold tabular-nums text-muted-foreground">{column.total.toLocaleString("es-MX")}</span>
            </header>
            <div className="grid max-h-[calc(100vh-19.5rem)] min-h-40 content-start gap-2 overflow-y-auto p-2">
              {column.leads.length ? (
                column.leads.map((lead) => <BoardLeadCard key={lead.id} lead={lead} now={now} showOwner={showOwner} />)
              ) : (
                <p className="px-1 py-6 text-center text-xs text-muted-foreground">{column.key === "registrado" ? "Sin registros en los últimos 7 días" : "Nadie en esta etapa"}</p>
              )}
              {column.total > column.leads.length ? (
                <p className="px-1 text-center text-xs text-muted-foreground">y {column.total - column.leads.length} más en «Prospectar»</p>
              ) : null}
            </div>
          </section>
        ))}
      </div>
    </div>
  );
}
