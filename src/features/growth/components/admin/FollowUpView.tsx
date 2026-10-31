"use client";

import { useState } from "react";
import { AlertTriangle, CalendarClock, Columns3, List } from "lucide-react";

import { useBoardLayout } from "@/features/growth/hooks/useBoardLayout";
import { useLeadBoard } from "@/features/growth/hooks/useLeadBoard";
import { EmptyState } from "@/components/admin/EmptyState";
import { FilterTabs } from "@/components/ui/FilterTabs";
import { LoadingBlock } from "@/components/ui/LoadingBlock";
import { BoardLeadCard } from "@/features/growth/components/admin/BoardLeadCard";
import { LeadBoardTable } from "@/features/growth/components/admin/LeadBoardTable";

import { nextStepDue, sortByUrgency } from "@/features/growth/helpers/leadPipeline";
import { BOARD_COLUMN_HINT, PIPELINE_STEPS } from "@/features/growth/constants/leadPipeline";

import type { BoardColumnKey } from "@/features/growth/interfaces/lead";
import type { BoardLayout, FollowUpViewProps } from "@/features/growth/interfaces/pipeline";

type ListTab = BoardColumnKey | "hoy" | "todos";

const COLUMN_LABEL = Object.fromEntries(PIPELINE_STEPS.map((step) => [step.key, step.label])) as Record<BoardColumnKey, string>;

const LAYOUTS: Array<{ value: BoardLayout; label: string; icon: typeof List; hint: string }> = [
  { value: "tablero", label: "Tablero", icon: Columns3, hint: "Una columna por etapa" },
  { value: "lista", label: "Lista", icon: List, hint: "Todo en una tabla, lo urgente arriba" },
];

const LIST_HINT: Record<"hoy" | "todos", string> = {
  hoy: "Vencidos y de hoy, lo más urgente primero.",
  todos: "Todos los negocios en seguimiento, lo más urgente primero.",
};

/** Daily follow-up: a board per stage or one sorted list on wide screens; phones get the list as cards. */
export function FollowUpView({ filters, showOwner }: FollowUpViewProps) {
  const { data, error, isLoading } = useLeadBoard({ municipio: filters.municipio, giro: filters.giro, owner: filters.owner });
  const [layout, setLayout] = useBoardLayout();
  const [listTab, setListTab] = useState<ListTab>("hoy");
  const now = new Date();

  if (isLoading && !data) return <LoadingBlock message="Cargando seguimiento…" variant="skeleton" />;
  if (error && !data) return <EmptyState icon={AlertTriangle} title="No pudimos cargar el seguimiento" description="Intenta de nuevo en un momento." tone="muted" />;
  if (!data) return null;

  const { columns, counts } = data;
  const all = sortByUrgency(columns.flatMap((column) => column.leads), now);
  const dueToday = all.filter((lead) => {
    const tone = nextStepDue(lead, now)?.tone;
    return tone === "danger" || tone === "warning";
  });
  const listLeads = listTab === "hoy" ? dueToday : listTab === "todos" ? all : sortByUrgency(columns.find((column) => column.key === listTab)?.leads ?? [], now);
  const listHint = listTab === "hoy" || listTab === "todos" ? LIST_HINT[listTab] : BOARD_COLUMN_HINT[listTab];

  const list = (
    <div className={`grid gap-3 ${layout === "tablero" ? "lg:hidden" : ""}`}>
      <FilterTabs
        tabs={[
          { value: "hoy", label: `Para hoy ${dueToday.length}` },
          { value: "todos", label: `Todos ${all.length}` },
          ...columns.map((column) => ({ value: column.key, label: `${COLUMN_LABEL[column.key]} ${column.total}` })),
        ]}
        activeValue={listTab}
        onTabChange={(value) => setListTab(value as ListTab)}
        ariaLabel="Qué negocios ver"
      />
      <p className="text-xs text-muted-foreground sm:text-sm">{listHint}</p>
      {listLeads.length ? (
        <>
          <div className="grid gap-2 lg:hidden">
            {listLeads.map((lead) => <BoardLeadCard key={lead.id} lead={lead} now={now} showOwner={showOwner} />)}
          </div>
          <div className="hidden lg:block">
            <LeadBoardTable leads={listLeads} now={now} showOwner={showOwner} />
          </div>
        </>
      ) : (
        <EmptyState
          icon={CalendarClock}
          title={listTab === "hoy" ? "Nada pendiente para hoy" : "Nadie aquí todavía"}
          description={listTab === "hoy" ? "Manda primeros mensajes desde «Prospectar»." : undefined}
          tone="muted"
        />
      )}
    </div>
  );

  return (
    <div className="grid grid-cols-1 gap-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <p className="text-sm text-muted-foreground">
          <b className="text-foreground">{counts.due_today.toLocaleString("es-MX")}</b> para hoy · <b className="text-red-600">{counts.overdue.toLocaleString("es-MX")}</b> vencidos · {counts.paused.toLocaleString("es-MX")} en pausa
        </p>
        <div className="hidden items-center gap-1 rounded-xl border border-border bg-surface p-1 lg:inline-flex" role="group" aria-label="Cómo ver el seguimiento">
          {LAYOUTS.map((option) => (
            <button
              key={option.value}
              type="button"
              aria-pressed={layout === option.value}
              title={option.hint}
              onClick={() => setLayout(option.value)}
              className={`inline-flex min-h-9 cursor-pointer items-center gap-1.5 rounded-lg px-3 text-sm font-semibold transition-colors ${
                layout === option.value ? "bg-accent text-accent-foreground" : "text-muted-foreground hover:bg-border-soft/60 hover:text-foreground"
              }`}
            >
              <option.icon className="h-4 w-4" aria-hidden />{option.label}
            </button>
          ))}
        </div>
      </div>

      {list}

      {layout === "tablero" ? (
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
                  sortByUrgency(column.leads, now).map((lead) => <BoardLeadCard key={lead.id} lead={lead} now={now} showOwner={showOwner} />)
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
      ) : null}
    </div>
  );
}
