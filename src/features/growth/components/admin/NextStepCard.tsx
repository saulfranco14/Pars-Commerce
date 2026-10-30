"use client";

import { BellRing, CalendarClock, CalendarX, MessageSquareReply, NotebookPen, PauseCircle, PlayCircle, UserPlus } from "lucide-react";

import { StatusBadge } from "@/components/admin/StatusBadge";
import { adminActionButtonDanger, adminActionButtonPrimary, adminActionButtonSecondary } from "@/components/admin/actionButtonClasses";

import { canFollowUp, formatDayTime, nextStepDue } from "@/features/growth/helpers/leadPipeline";
import { OPEN_STAGES, STAGE_ACTIONS, STAGE_ACTION_HINT, STAGE_ACTION_LABEL } from "@/features/growth/constants/leadPipeline";

import type { StageAction } from "@/features/growth/constants/leadPipeline";
import type { NextStepCardProps } from "@/features/growth/interfaces/pipeline";

const ACTION_ICON: Partial<Record<StageAction, typeof BellRing>> = {
  replied: MessageSquareReply,
  schedule_visit: CalendarClock,
  reschedule_visit: CalendarClock,
  cancel_visit: CalendarX,
  remind: BellRing,
  pause: PauseCircle,
  resume: PlayCircle,
  note: NotebookPen,
  register: UserPlus,
};

const buttonText = "grid w-full justify-items-start gap-0.5 py-2.5 text-left";

/** What to do with this prospect now, why, and only the moves its stage allows; each button says what it does. */
export function NextStepCard({ lead, busy, reason, onAction }: NextStepCardProps) {
  const now = new Date();
  const due = nextStepDue(lead, now);
  const paused = Boolean(lead.snoozed_until && new Date(lead.snoozed_until) > now);
  const actions = [...STAGE_ACTIONS[lead.stage], ...(paused ? (["resume"] as StageAction[]) : [])].filter((action) => canFollowUp(lead, action, now));
  const [primary, ...rest] = actions.filter((action) => action !== "note");
  const open = OPEN_STAGES.includes(lead.stage);
  const PrimaryIcon = primary ? ACTION_ICON[primary] : undefined;

  return (
    <section className="grid gap-3 rounded-2xl border border-accent/30 bg-surface p-4 sm:p-5" aria-label="Próximo paso">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <p className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground">Próximo paso</p>
        {due ? <StatusBadge tone={due.tone} label={due.when} compact dot={false} /> : null}
      </div>
      {due ? (
        <p className="text-lg font-bold tracking-tight text-foreground">{due.label}</p>
      ) : (
        <p className="text-sm text-muted-foreground">{open ? "Todavía no le escribes: empieza con el WhatsApp de abajo." : "Ya no tiene pasos pendientes."}</p>
      )}
      {reason ? <p className="text-sm text-muted-foreground">Por qué: {reason}</p> : null}
      {lead.stage === "cita" && lead.appointment_at ? <p className="text-sm text-foreground">Cita: <b>{formatDayTime(lead.appointment_at)}</b></p> : null}
      {paused ? <p className="text-sm text-muted-foreground">En pausa hasta el {formatDayTime(lead.snoozed_until as string)}.</p> : null}
      {lead.next_step_note ? <p className="rounded-xl bg-border-soft/50 px-3 py-2 text-sm text-foreground">“{lead.next_step_note}”</p> : null}

      {actions.length ? (
        <div className="grid gap-2">
          {primary ? (
            <button type="button" disabled={busy} onClick={() => onAction(primary)} className={`${adminActionButtonPrimary} ${buttonText}`}>
              <span className="inline-flex items-center gap-2">{PrimaryIcon ? <PrimaryIcon className="h-4 w-4" aria-hidden /> : null}{STAGE_ACTION_LABEL[primary]}</span>
              <span className="text-xs font-normal opacity-85">{STAGE_ACTION_HINT[primary]}</span>
            </button>
          ) : null}
          <div className="grid grid-cols-2 gap-2">
            {[...rest, ...(actions.includes("note") ? (["note"] as StageAction[]) : [])].map((action) => {
              const Icon = ACTION_ICON[action];
              return (
                <button key={action} type="button" disabled={busy} onClick={() => onAction(action)} className={`${adminActionButtonSecondary} ${buttonText}`}>
                  <span className="inline-flex items-center gap-2">{Icon ? <Icon className="h-4 w-4" aria-hidden /> : null}{STAGE_ACTION_LABEL[action]}</span>
                  <span className="text-xs font-normal text-muted-foreground">{STAGE_ACTION_HINT[action]}</span>
                </button>
              );
            })}
          </div>
        </div>
      ) : null}
      {open ? (
        <button type="button" disabled={busy} onClick={() => onAction("not_interested")} className={`${adminActionButtonDanger} ${buttonText}`}>
          <span>{STAGE_ACTION_LABEL.not_interested}</span>
          <span className="text-xs font-normal">{STAGE_ACTION_HINT.not_interested}</span>
        </button>
      ) : null}
    </section>
  );
}
