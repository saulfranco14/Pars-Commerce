"use client";

import { useState } from "react";
import { AlertTriangle, CalendarClock, ChevronDown, Columns3, List } from "lucide-react";

import { useBoardLayout } from "@/features/growth/hooks/useBoardLayout";
import { useFollowUpAccordion } from "@/features/growth/hooks/useFollowUpAccordion";
import { EmptyState } from "@/components/admin/EmptyState";
import { LoadingBlock } from "@/components/ui/LoadingBlock";
import { BoardLeadCard } from "@/features/growth/components/admin/BoardLeadCard";
import { FollowUpGroup } from "@/features/growth/components/admin/FollowUpGroup";
import { StageSheet } from "@/features/growth/components/admin/StageSheet";

import { followUpListCounts, followUpListLeads } from "@/features/growth/helpers/followUpList";
import { mexicoDayStart, sortByUrgency } from "@/features/growth/helpers/leadPipeline";
import { BOARD_COLUMN_HINT, FOLLOW_UP_LISTS, PIPELINE_STEPS } from "@/features/growth/constants/leadPipeline";

import type { BoardColumnKey } from "@/features/growth/interfaces/lead";
import type { BoardLayout } from "@/features/growth/interfaces/pipeline";
import type { FollowUpViewProps } from "@/features/growth/interfaces/prospects";

const COLUMN_LABEL = Object.fromEntries(PIPELINE_STEPS.map((step) => [step.key, step.label])) as Record<BoardColumnKey, string>;

const LAYOUTS: Array<{ value: BoardLayout; label: string; icon: typeof List; hint: string }> = [
  { value: "lista", label: "Lista", icon: List, hint: "Lo urgente arriba, agrupado" },
  { value: "tablero", label: "Tablero", icon: Columns3, hint: "Una columna por etapa" },
];

/** Daily follow-up: «Para hoy» grouped into overdue and today; wide screens can switch to one column per stage. */
export function FollowUpView({ board, error, isLoading, pending, list, searching, showOwner, viewerId, onList, onOpen }: FollowUpViewProps) {
  const [layout, setLayout] = useBoardLayout();
  const accordion = useFollowUpAccordion();
  const [picking, setPicking] = useState(false);
  const now = new Date();

  if (isLoading && !board) return <LoadingBlock message="Cargando seguimiento…" variant="skeleton" />;
  if (error && !board) return <EmptyState icon={AlertTriangle} title="No pudimos cargar el seguimiento" description="Intenta de nuevo en un momento." tone="muted" />;
  if (!board) return null;

  const counts = followUpListCounts(board, searching);
  const leads = followUpListLeads(board, list, now);
  const current = FOLLOW_UP_LISTS.find((option) => option.value === list) ?? FOLLOW_UP_LISTS[0];
  const open = () => onOpen(leads);
  const rowProps = { now, showOwner, viewerId, onOpen: open };

  let groups;
  if (list === "hoy") {
    const today = mexicoDayStart(now).getTime();
    const overdue = leads.filter((lead) => lead.next_step_at && Date.parse(lead.next_step_at) < today);
    const dueToday = leads.filter((lead) => !overdue.includes(lead));
    const lateOpen = accordion.isOpen("vencidos", overdue.length > 0);
    const todayOpen = accordion.isOpen("para_hoy", overdue.length === 0);
    groups = (
      <>
        <FollowUpGroup tone="danger" title="Vencidos" total={searching ? overdue.length : board.counts.overdue} hint="lo más atrasado primero" leads={overdue} open={lateOpen} onToggle={() => accordion.toggle("vencidos", lateOpen)} {...rowProps} />
        <FollowUpGroup tone="warning" title="Para hoy" total={searching ? dueToday.length : board.counts.due_today - board.counts.overdue} hint="les toca hoy" leads={dueToday} open={todayOpen} onToggle={() => accordion.toggle("para_hoy", todayOpen)} {...rowProps} />
      </>
    );
  } else {
    const listOpen = accordion.isOpen(list, true);
    groups = <FollowUpGroup tone="neutral" title={current.label} total={counts[list]} hint="lo más urgente primero" leads={leads} open={listOpen} onToggle={() => accordion.toggle(list, listOpen)} {...rowProps} />;
  }

  return (
    <div className="grid grid-cols-1 gap-3">
      <div className="flex items-center gap-2">
        <button
          type="button"
          onClick={() => setPicking(true)}
          className="inline-flex min-h-11 w-full cursor-pointer items-center justify-between gap-2 rounded-xl border border-border bg-surface px-3.5 text-sm font-bold text-foreground transition-colors hover:border-accent/50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/50 lg:w-auto lg:min-w-64"
        >
          <span>{current.label} <span className="font-semibold tabular-nums text-muted-foreground">· {counts[list].toLocaleString("es-MX")}</span></span>
          <ChevronDown className="h-4 w-4 text-muted-foreground" aria-hidden />
        </button>
        <div className="ml-auto hidden items-center gap-1 rounded-xl border border-border bg-surface p-1 lg:inline-flex" role="group" aria-label="Cómo ver el seguimiento">
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

      <div data-pending={pending} className={`grid gap-3 transition-opacity duration-200 data-[pending=true]:opacity-45 data-[pending=true]:delay-100 ${layout === "tablero" ? "lg:hidden" : ""}`}>
        {leads.length ? groups : (
          <EmptyState
            icon={CalendarClock}
            title={list === "hoy" ? "Nada pendiente para hoy" : "Nadie aquí todavía"}
            description={list === "hoy" ? "Manda primeros mensajes desde «Prospectar»." : undefined}
            tone="muted"
          />
        )}
      </div>

      {layout === "tablero" ? (
        <div data-pending={pending} className="hidden gap-3 transition-opacity duration-200 data-[pending=true]:opacity-45 lg:grid lg:grid-cols-5">
          {board.columns.map((column) => (
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

      <StageSheet isOpen={picking} active={list} counts={counts} onClose={() => setPicking(false)} onPick={(value) => { setPicking(false); onList(value); }} />
    </div>
  );
}
