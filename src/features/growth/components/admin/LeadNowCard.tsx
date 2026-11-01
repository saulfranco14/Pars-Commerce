"use client";

import { MoreHorizontal } from "lucide-react";

import { StatusBadge } from "@/components/admin/StatusBadge";
import { adminActionButtonDanger, adminActionButtonIcon, adminActionButtonPrimary, adminActionButtonSecondary } from "@/components/admin/actionButtonClasses";
import { LeadActionBar } from "@/features/growth/components/admin/LeadActionBar";
import { LeadMessage } from "@/features/growth/components/admin/LeadMessage";

import { canFollowUp, formatDayTime, nextStepDue } from "@/features/growth/helpers/leadPipeline";
import { LEAD_ACTION_ICON, LEAD_ACTION_LABEL, LEAD_ACTION_SHORT } from "@/features/growth/constants/leadActions";
import { OPEN_STAGES, STAGE_ACTIONS } from "@/features/growth/constants/leadPipeline";

import type { StageAction } from "@/features/growth/constants/leadPipeline";
import type { LeadNowCardProps, LeadSheetAction } from "@/features/growth/interfaces/leadActions";

/** What to do with this prospect now: one main move, two shortcuts for its stage and the rest behind «Acciones». */
export function LeadNowCard({ lead, busy, reason, showMessage, onAction, onOpenActions, onOutcome }: LeadNowCardProps) {
  const now = new Date();
  const due = nextStepDue(lead, now);
  const paused = Boolean(lead.snoozed_until && new Date(lead.snoozed_until) > now);
  const open = OPEN_STAGES.includes(lead.stage);
  const followUp = lead.whatsapp_attempts > 0 && (lead.stage === "contactado" || lead.stage === "sin_respuesta");
  const actions = [...STAGE_ACTIONS[lead.stage], ...(paused ? (["resume"] as StageAction[]) : [])].filter((action) => action !== "note" && canFollowUp(lead, action, now));
  const primary = showMessage ? null : actions[0] ?? null;
  const rest = showMessage ? actions : actions.slice(1);
  const picks: LeadSheetAction[] = followUp && open ? [rest[0] ?? "replied", "not_interested"] : rest.slice(0, 2);
  const PrimaryIcon = primary ? LEAD_ACTION_ICON[primary] : null;

  const shortcuts = (
    <div className="flex gap-2">
      {picks.map((action) => {
        const Icon = LEAD_ACTION_ICON[action];
        return (
          <button key={action} type="button" disabled={busy} onClick={() => onAction(action)} className={`${action === "not_interested" ? adminActionButtonDanger : adminActionButtonSecondary} min-w-0 flex-1 px-2.5`}>
            <Icon className="h-4 w-4 shrink-0" aria-hidden /><span className="truncate">{LEAD_ACTION_SHORT[action] ?? LEAD_ACTION_LABEL[action]}</span>
          </button>
        );
      })}
      {picks.length ? (
        <button type="button" onClick={onOpenActions} aria-label="Más acciones" className={adminActionButtonIcon}>
          <MoreHorizontal className="h-4 w-4" aria-hidden />
        </button>
      ) : (
        <button type="button" onClick={onOpenActions} className={`${adminActionButtonSecondary} flex-1`}>
          <MoreHorizontal className="h-4 w-4" aria-hidden />Más acciones
        </button>
      )}
    </div>
  );

  function primaryButton(className: string) {
    if (!primary || !PrimaryIcon) return null;
    return (
      <button type="button" disabled={busy} onClick={() => onAction(primary as StageAction)} className={`${adminActionButtonPrimary} ${className}`}>
        <PrimaryIcon className="h-5 w-5" aria-hidden />{LEAD_ACTION_LABEL[primary]}
      </button>
    );
  }

  return (
    <section className="grid gap-3 rounded-2xl border border-accent/30 bg-surface p-4 sm:p-5" aria-label="Ahora">
      <div className="flex items-center justify-between gap-2">
        <p className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground">Ahora</p>
        {due ? <StatusBadge tone={due.tone} label={due.when} compact dot={false} /> : null}
      </div>
      <div className="grid gap-0.5">
        <p className="text-lg font-bold tracking-tight text-foreground">
          {due ? due.label : open ? "Mándale el primer mensaje" : "Ya no tiene pasos pendientes"}
        </p>
        {reason ? <p className="text-sm text-muted-foreground">{reason}</p> : null}
        {lead.stage === "cita" && lead.appointment_at ? <p className="text-sm text-foreground">Cita: <b>{formatDayTime(lead.appointment_at)}</b></p> : null}
        {paused ? <p className="text-sm text-muted-foreground">En pausa hasta el {formatDayTime(lead.snoozed_until as string)}.</p> : null}
      </div>
      {lead.next_step_note ? <p className="rounded-xl bg-border-soft/50 px-3 py-2 text-sm text-foreground">“{lead.next_step_note}”</p> : null}

      {showMessage ? (
        <LeadMessage
          key={`${lead.phone_e164}-${lead.whatsapp_attempts}-${lead.phone_status}-${lead.stage}`}
          leadId={lead.id}
          busy={busy}
          followUp={followUp}
          shortcuts={shortcuts}
          onOpenActions={onOpenActions}
          onOutcome={onOutcome}
        />
      ) : (
        <>
          <div className="hidden md:grid">{primaryButton("min-h-13 w-full text-base")}</div>
          {shortcuts}
          {primary ? <LeadActionBar onOpenActions={onOpenActions}>{primaryButton("min-h-12 w-full")}</LeadActionBar> : null}
        </>
      )}
    </section>
  );
}
