"use client";

import { useState } from "react";
import { AlertTriangle, CalendarClock } from "lucide-react";

import { useLeadBoard } from "@/features/growth/hooks/useLeadBoard";
import { EmptyState } from "@/components/admin/EmptyState";
import { FilterTabs } from "@/components/ui/FilterTabs";
import { LoadingBlock } from "@/components/ui/LoadingBlock";
import { BoardLeadCard } from "@/features/growth/components/admin/BoardLeadCard";

import { nextStepDue } from "@/features/growth/helpers/leadPipeline";
import { BOARD_COLUMN_HINT, PIPELINE_STEPS } from "@/features/growth/constants/leadPipeline";

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
      <p className="text-sm text-muted-foreground">
        {counts.due_today.toLocaleString("es-MX")} para hoy · {counts.overdue.toLocaleString("es-MX")} vencidos · {counts.paused.toLocaleString("es-MX")} en pausa
      </p>

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
        {mobileTab !== "hoy" ? <p className="mt-2 text-xs text-muted-foreground">{BOARD_COLUMN_HINT[mobileTab]}</p> : null}
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
            <header className="grid gap-1 border-b border-border-soft px-3 py-2.5">
              <div className="flex items-center justify-between gap-2">
                <h3 className="truncate text-sm font-bold text-foreground">{COLUMN_LABEL[column.key]}</h3>
                <span className="rounded-full bg-border-soft px-2 py-0.5 text-xs font-bold tabular-nums text-muted-foreground">{column.total.toLocaleString("es-MX")}</span>
              </div>
              <p className="text-xs leading-snug text-muted-foreground">{BOARD_COLUMN_HINT[column.key]}</p>
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
