"use client";

import { useState } from "react";
import { MessageCircle, Pencil, RefreshCw, RotateCcw, Sparkles } from "lucide-react";

import { useWhatsappDraft } from "@/features/growth/hooks/useWhatsappDraft";
import { adminActionButtonAi, adminActionButtonPrimary, adminActionButtonText } from "@/components/admin/actionButtonClasses";
import { LoadingBlock } from "@/components/ui/LoadingBlock";
import { Notification } from "@/components/ui/Notification";
import { AiWritingState } from "@/features/growth/components/admin/AiWritingState";
import { LeadActionBar } from "@/features/growth/components/admin/LeadActionBar";

import { sameTabOnPhones } from "@/features/growth/helpers/openWhatsapp";
import { TEMPLATE_STEPS, WHATSAPP_MAX_CHARS } from "@/features/growth/constants/templateVariables";

import type { LeadMessageProps } from "@/features/growth/interfaces/leadActions";
import type { WhatsappStep } from "@/features/growth/interfaces/whatsapp";

const STEPS = TEMPLATE_STEPS.whatsapp;
const stepLabel = (step: WhatsappStep | null) => STEPS.find((option) => option.value === step)?.label ?? "Mensaje sugerido";
const fieldClass = "input-form w-full rounded-xl border border-border bg-surface-raised px-3 text-foreground focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/20";

/** The suggested WhatsApp, folded and editable; sending opens WhatsApp and counts it as sent right away. */
export function LeadMessage({ leadId, busy, followUp, shortcuts, onOpenActions, onOutcome }: LeadMessageProps) {
  const composer = useWhatsappDraft(leadId);
  const { draft } = composer;
  const [editing, setEditing] = useState(false);
  const writing = composer.aiBusy && !composer.aiWritten;
  const variants = draft?.variants ?? [];
  const nextVariant = draft && variants.length > 1 ? variants[(variants.indexOf(draft.variant) + 1) % variants.length] : null;
  const label = composer.aiWritten ? "Escrito con IA · revísalo" : composer.edited ? "Editado por ti" : stepLabel(draft?.step ?? null);

  function sendLink(className: string) {
    if (!composer.waLink) return null;
    return (
      <a
        href={composer.waLink}
        target="_blank"
        rel="noopener noreferrer"
        aria-disabled={busy || composer.aiBusy}
        onClick={(event) => {
          if (composer.aiBusy) {
            event.preventDefault();
            return;
          }
          void onOutcome("whatsapp_sent", composer.sent());
          sameTabOnPhones(event);
        }}
        className={`${adminActionButtonPrimary} ${className} ${composer.aiBusy ? "pointer-events-none opacity-60" : ""}`}
      >
        <MessageCircle className="h-5 w-5" aria-hidden />Enviar por WhatsApp
      </a>
    );
  }

  return (
    <div className="grid gap-3">
      <div className="flex items-center justify-between gap-2">
        <span className="min-w-0 truncate text-sm font-semibold text-muted-foreground">{label}</span>
        <button
          type="button"
          disabled={composer.aiBusy || composer.loading || !draft}
          onClick={() => { setEditing(false); void composer.writeWithAi(); }}
          className={`${adminActionButtonAi} min-h-9 shrink-0 px-3 text-xs ${composer.aiBusy ? "ai-busy" : ""}`}
        >
          <Sparkles className={`h-4 w-4 ${composer.aiBusy ? "motion-safe:animate-spin" : ""}`} aria-hidden />
          {composer.aiBusy ? "Escribiendo…" : composer.aiWritten ? "Otro con IA" : followUp ? "Uno distinto con IA" : "Mejorar con IA"}
        </button>
      </div>

      {draft?.suggestion.wait ? <Notification tone="warning" message={draft.suggestion.reason} /> : null}
      {composer.error ? <Notification tone="error" message={composer.error} /> : null}
      {composer.loading && !draft ? <LoadingBlock message="Armando el mensaje…" variant="skeleton" /> : null}

      {writing ? <AiWritingState /> : draft ? (
        editing ? (
          <div className="grid gap-2">
            <label className="grid gap-1 text-xs font-semibold text-muted-foreground">
              Qué mensaje mandar
              <select value={draft.step} disabled={composer.loading} onChange={(event) => composer.selectStep(event.target.value as WhatsappStep)} className={`${fieldClass} min-h-11 text-sm font-normal`}>
                {STEPS.map((option) => (
                  <option key={option.value} value={option.value}>{option.label}{option.value === draft.suggestion.step ? " (sugerido)" : ""}</option>
                ))}
              </select>
            </label>
            <textarea
              aria-label="Mensaje"
              value={composer.text}
              onChange={(event) => composer.setText(event.target.value)}
              rows={9}
              maxLength={WHATSAPP_MAX_CHARS}
              autoFocus
              disabled={composer.loading || composer.aiBusy}
              className={`${fieldClass} min-h-48 resize-y py-2.5 text-sm leading-relaxed`}
            />
          </div>
        ) : (
          <button type="button" onClick={() => setEditing(true)} className="w-full cursor-text rounded-xl border border-border-soft bg-surface-raised p-3 text-left text-sm leading-relaxed text-foreground hover:border-accent/40" title="Toca para editar">
            <span className="line-clamp-4 whitespace-pre-wrap">{composer.text}</span>
          </button>
        )
      ) : null}

      {draft ? (
        <div className="-mt-1 flex flex-wrap items-center gap-1">
          <button type="button" disabled={composer.aiBusy} onClick={() => setEditing((value) => !value)} className={adminActionButtonText}>
            <Pencil className="h-4 w-4" aria-hidden />{editing ? "Listo" : "Editar"}
          </button>
          {nextVariant ? (
            <button type="button" disabled={composer.loading || composer.aiBusy} onClick={() => { setEditing(false); void composer.selectVariant(nextVariant); }} className={adminActionButtonText}>
              <RefreshCw className="h-4 w-4" aria-hidden />Otro mensaje
            </button>
          ) : null}
          {composer.edited && !composer.aiBusy ? (
            <button type="button" onClick={composer.resetText} className={adminActionButtonText}>
              <RotateCcw className="h-4 w-4" aria-hidden />Volver al sugerido
            </button>
          ) : null}
        </div>
      ) : null}

      <div className="hidden md:grid">{sendLink("min-h-13 w-full text-base")}</div>
      {shortcuts}
      <LeadActionBar onOpenActions={onOpenActions}>{sendLink("min-h-12 w-full")}</LeadActionBar>
    </div>
  );
}
