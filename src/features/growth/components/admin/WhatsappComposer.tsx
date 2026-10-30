"use client";

import { Check, MessageCircle, PhoneOff, RotateCcw, XCircle } from "lucide-react";

import { useWhatsappDraft } from "@/features/growth/hooks/useWhatsappDraft";
import { adminActionButtonPrimary, adminActionButtonSecondary } from "@/components/admin/actionButtonClasses";
import { FilterTabs } from "@/components/ui/FilterTabs";
import { LoadingBlock } from "@/components/ui/LoadingBlock";
import { Notification } from "@/components/ui/Notification";

import { sameTabOnPhones } from "@/features/growth/helpers/openWhatsapp";
import { TEMPLATE_STEPS, WHATSAPP_MAX_CHARS } from "@/features/growth/constants/templateVariables";

import type { TemplateVariant } from "@/features/growth/interfaces/template";
import type { WhatsappComposerProps, WhatsappStep } from "@/features/growth/interfaces/whatsapp";

const STEPS = TEMPLATE_STEPS.whatsapp;
const stepLabel = (step: WhatsappStep | null) => STEPS.find((option) => option.value === step)?.label ?? "";

const fieldClass = "input-form w-full rounded-xl border border-border bg-surface-raised px-3 text-foreground focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/20";

export function WhatsappComposer({ leadId, busy, onOutcome }: WhatsappComposerProps) {
  const composer = useWhatsappDraft(leadId);
  const { draft } = composer;
  const suggested = draft?.suggestion.step ?? null;

  return (
    <section className="grid gap-3 rounded-2xl border border-border bg-surface p-4 sm:p-5">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h3 className="inline-flex items-center gap-2 text-base font-bold text-foreground"><MessageCircle className="h-4 w-4" aria-hidden />Mensaje de WhatsApp</h3>
        {draft ? <span className="text-xs text-muted-foreground">Variante {draft.variant}{draft.version > 1 ? ` · v${draft.version}` : ""}</span> : null}
      </div>

      {draft ? (
        <Notification
          tone={draft.suggestion.wait ? "warning" : "info"}
          title={suggested ? `Sugerido: ${stepLabel(suggested)}` : undefined}
          message={draft.suggestion.reason}
        />
      ) : null}

      <label className="grid gap-1 text-sm font-semibold text-foreground">
        Qué mensaje mandar
        <select
          value={draft?.step ?? ""}
          disabled={composer.loading}
          onChange={(event) => composer.selectStep(event.target.value as WhatsappStep)}
          className={`${fieldClass} min-h-11 text-sm`}
        >
          {STEPS.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}{option.value === suggested ? " (sugerido)" : ""}
            </option>
          ))}
        </select>
      </label>
      {draft && draft.variants.length > 1 ? (
        <FilterTabs
          tabs={draft.variants.map((variant) => ({ value: variant, label: `Variante ${variant}` }))}
          activeValue={draft.variant}
          onTabChange={(value) => composer.selectVariant(value as TemplateVariant)}
          ariaLabel="Variante"
          disabled={composer.loading}
        />
      ) : null}

      {composer.loading && !draft ? <LoadingBlock message="Armando el mensaje…" variant="skeleton" /> : null}
      {composer.error ? <Notification tone="error" message={composer.error} /> : null}

      {draft ? (
        <>
          <label className="grid gap-1">
            <span className="text-xs text-muted-foreground">Puedes editarlo: se manda tal cual lo dejes.</span>
            <textarea
              value={composer.text}
              onChange={(event) => composer.setText(event.target.value)}
              rows={9}
              maxLength={WHATSAPP_MAX_CHARS}
              disabled={composer.loading}
              className={`${fieldClass} min-h-48 resize-y py-2.5 text-sm leading-relaxed ${composer.loading ? "opacity-60" : ""}`}
            />
          </label>
          <div className="flex flex-wrap items-center justify-between gap-2">
            <span className="text-xs text-muted-foreground">{composer.edited ? "Editado por ti · se guardará así" : "Texto sugerido"}</span>
            {composer.edited ? (
              <button type="button" onClick={composer.resetText} className="inline-flex min-h-11 items-center gap-1.5 text-sm font-semibold text-accent hover:underline">
                <RotateCcw className="h-4 w-4" aria-hidden />Volver al sugerido
              </button>
            ) : null}
          </div>
          {composer.waLink ? (
            <a href={composer.waLink} target="_blank" rel="noopener noreferrer" onClick={(event) => { composer.markOpened(); sameTabOnPhones(event); }} className={adminActionButtonPrimary}>
              <MessageCircle className="h-4 w-4" aria-hidden />Abrir WhatsApp con este mensaje
            </a>
          ) : null}
          {composer.opened ? (
            <div className="grid gap-2 border-t border-border-soft pt-3">
              <p className="text-sm font-semibold text-foreground">¿Lo enviaste?</p>
              <p className="text-xs text-muted-foreground">Si dices que sí, este texto queda en la conversación.</p>
              <div className="flex flex-wrap gap-2">
                <button type="button" disabled={busy} onClick={() => void onOutcome("whatsapp_sent", composer.sent())} className={adminActionButtonPrimary}><Check className="h-4 w-4" aria-hidden />Sí, enviado</button>
                <button type="button" disabled={busy} onClick={() => void onOutcome("no_whatsapp")} className={adminActionButtonSecondary}><PhoneOff className="h-4 w-4" aria-hidden />No tiene WhatsApp</button>
                <button type="button" disabled={busy} onClick={() => void onOutcome("wrong_number")} className={adminActionButtonSecondary}><XCircle className="h-4 w-4" aria-hidden />Número equivocado</button>
              </div>
            </div>
          ) : null}
        </>
      ) : null}
    </section>
  );
}
