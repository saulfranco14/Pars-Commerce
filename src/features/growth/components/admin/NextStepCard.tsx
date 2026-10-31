"use client";

import { BellRing, CalendarClock, CalendarX, ChevronRight, MessageSquareReply, NotebookPen, PauseCircle, PlayCircle, UserPlus, UserX } from "lucide-react";

import { StatusBadge } from "@/components/admin/StatusBadge";

import { canFollowUp, formatDayTime, nextStepDue } from "@/features/growth/helpers/leadPipeline";
import { OPEN_STAGES, STAGE_ACTIONS, STAGE_ACTION_HINT, STAGE_ACTION_LABEL } from "@/features/growth/constants/leadPipeline";

import type { StageAction } from "@/features/growth/constants/leadPipeline";
import type { NextStepCardProps } from "@/features/growth/interfaces/pipeline";

const ACTION_ICON: Record<StageAction, typeof BellRing> = {
  replied: MessageSquareReply,
  schedule_visit: CalendarClock,
  reschedule_visit: CalendarClock,
  cancel_visit: CalendarX,
  remind: BellRing,
  pause: PauseCircle,
  resume: PlayCircle,
  note: NotebookPen,
  register: UserPlus,
  not_interested: UserX,
};

const rowClass =
  "flex min-h-14 w-full cursor-pointer items-center gap-3 px-3 py-2.5 text-left transition-colors disabled:cursor-not-allowed disabled:opacity-60 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-accent/50";

function ActionRow({ action, busy, onAction }: { action: StageAction; busy: boolean; onAction: (action: StageAction) => void }) {
  const Icon = ACTION_ICON[action];
  const danger = action === "not_interested";
  return (
    <li>
      <button type="button" disabled={busy} onClick={() => onAction(action)} className={`${rowClass} ${danger ? "hover:bg-red-50 dark:hover:bg-red-950/30" : "hover:bg-border-soft/40"}`}>
        <span className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-xl ${danger ? "bg-red-50 text-red-600 dark:bg-red-950/40" : "bg-border-soft/70 text-foreground"}`}>
          <Icon className="h-4 w-4" aria-hidden />
        </span>
        <span className="grid min-w-0 flex-1 gap-0.5">
          <span className={`text-sm font-semibold ${danger ? "text-red-600" : "text-foreground"}`}>{STAGE_ACTION_LABEL[action]}</span>
          <span className="text-xs leading-snug text-muted-foreground">{STAGE_ACTION_HINT[action]}</span>
        </span>
        <ChevronRight className="h-4 w-4 shrink-0 text-muted-foreground" aria-hidden />
      </button>
    </li>
  );
}

/** What to do with this prospect now and why; every move says what it will do before you tap it. */
export function NextStepCard({ lead, busy, reason, onAction }: NextStepCardProps) {
  const now = new Date();
  const due = nextStepDue(lead, now);
  const paused = Boolean(lead.snoozed_until && new Date(lead.snoozed_until) > now);
  const actions = [...STAGE_ACTIONS[lead.stage], ...(paused ? (["resume"] as StageAction[]) : [])].filter((action) => canFollowUp(lead, action, now));
  const [primary, ...rest] = actions.filter((action) => action !== "note");
  const open = OPEN_STAGES.includes(lead.stage);
  const others: StageAction[] = [...rest, ...(actions.includes("note") ? (["note"] as StageAction[]) : []), ...(open ? (["not_interested"] as StageAction[]) : [])];
  const PrimaryIcon = primary ? ACTION_ICON[primary] : null;

  return (
    <section className="grid gap-4 rounded-2xl border border-accent/30 bg-surface p-4 sm:p-5" aria-label="Qué sigue">
      <div className="grid gap-1.5">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <p className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground">Qué sigue</p>
          {due ? <StatusBadge tone={due.tone} label={due.when} compact dot={false} /> : null}
        </div>
        <p className="text-lg font-bold tracking-tight text-foreground">
          {due ? due.label : open ? "Mándale el primer mensaje" : "Ya no tiene pasos pendientes"}
        </p>
        {reason ? (
          <p className="rounded-xl bg-accent/5 px-3 py-2 text-sm text-foreground">
            <span className="font-semibold">Por qué: </span>{reason}
          </p>
        ) : null}
        {lead.stage === "cita" && lead.appointment_at ? <p className="text-sm text-foreground">Cita: <b>{formatDayTime(lead.appointment_at)}</b></p> : null}
        {paused ? <p className="text-sm text-muted-foreground">En pausa hasta el {formatDayTime(lead.snoozed_until as string)}.</p> : null}
        {lead.next_step_note ? <p className="rounded-xl bg-border-soft/50 px-3 py-2 text-sm text-foreground">“{lead.next_step_note}”</p> : null}
      </div>

      {primary && PrimaryIcon ? (
        <button
          type="button"
          disabled={busy}
          onClick={() => onAction(primary)}
          className="flex min-h-14 w-full cursor-pointer items-center gap-3 rounded-xl bg-accent px-4 py-3 text-left text-accent-foreground shadow-sm shadow-accent/15 transition-colors hover:bg-accent/90 disabled:cursor-not-allowed disabled:opacity-60 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2"
        >
          <PrimaryIcon className="h-5 w-5 shrink-0" aria-hidden />
          <span className="grid min-w-0 flex-1 gap-0.5">
            <span className="text-sm font-bold">{STAGE_ACTION_LABEL[primary]}</span>
            <span className="text-xs leading-snug opacity-90">{STAGE_ACTION_HINT[primary]}</span>
          </span>
        </button>
      ) : null}

      {others.length ? (
        <div className="grid gap-2">
          <p className="text-xs font-semibold text-muted-foreground">Otras acciones</p>
          <ul className="divide-y divide-border-soft overflow-hidden rounded-xl border border-border">
            {others.map((action) => <ActionRow key={action} action={action} busy={busy} onAction={onAction} />)}
          </ul>
        </div>
      ) : null}
    </section>
  );
}
