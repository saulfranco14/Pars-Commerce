"use client";

import { Check, MessageCircle, PhoneOff, RefreshCw, XCircle } from "lucide-react";

import { useWhatsappDraft } from "@/features/growth/hooks/useWhatsappDraft";
import { adminActionButtonPrimary, adminActionButtonSecondary } from "@/components/admin/actionButtonClasses";
import { FilterTabs } from "@/components/ui/FilterTabs";
import { LoadingBlock } from "@/components/ui/LoadingBlock";
import { Notification } from "@/components/ui/Notification";

import { sameTabOnPhones } from "@/features/growth/helpers/openWhatsapp";
import { TEMPLATE_STEPS } from "@/features/growth/constants/templateVariables";

import type { TemplateVariant } from "@/features/growth/interfaces/template";
import type { WhatsappComposerProps, WhatsappStep } from "@/features/growth/interfaces/whatsapp";

const STEP_TABS = TEMPLATE_STEPS.whatsapp;

export function WhatsappComposer({ leadId, busy, onOutcome }: WhatsappComposerProps) {
  const composer = useWhatsappDraft(leadId);
  const { draft } = composer;

  return (
    <section className="grid gap-3 rounded-2xl border border-border bg-surface p-4 sm:p-5">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h3 className="inline-flex items-center gap-2 text-base font-bold text-foreground"><MessageCircle className="h-4 w-4" aria-hidden />Mensaje de WhatsApp</h3>
        {draft ? <span className="text-xs text-muted-foreground">Variante {draft.variant}{draft.version > 1 ? ` · v${draft.version}` : ""}</span> : null}
      </div>

      {draft ? (
        <Notification
          tone={draft.suggestion.wait ? "warning" : "info"}
          title={draft.suggestion.step ? `Sugerido: ${STEP_TABS.find((tab) => tab.value === draft.suggestion.step)?.label}` : undefined}
          message={draft.suggestion.reason}
        />
      ) : null}

      <FilterTabs
        tabs={STEP_TABS}
        activeValue={draft?.step ?? ""}
        onTabChange={(value) => composer.selectStep(value as WhatsappStep)}
        ariaLabel="Qué mensaje mandar"
        disabled={composer.loading}
      />
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
          <p className={`whitespace-pre-wrap rounded-xl border border-border-soft bg-surface-raised p-3 text-sm leading-relaxed text-foreground ${composer.loading ? "opacity-60" : ""}`}>{draft.body}</p>
          <div className="flex flex-wrap gap-2">
            <a href={draft.waLink} target="_blank" rel="noopener noreferrer" onClick={(event) => { composer.markOpened(); sameTabOnPhones(event); }} className={adminActionButtonPrimary}>
              <MessageCircle className="h-4 w-4" aria-hidden />Abrir WhatsApp con este mensaje
            </a>
            <button type="button" disabled={composer.loading} onClick={() => void composer.reload()} className={adminActionButtonSecondary}>
              <RefreshCw className="h-4 w-4" aria-hidden />Volver al sugerido
            </button>
          </div>
          {composer.opened ? (
            <div className="grid gap-2 border-t border-border-soft pt-3">
              <p className="text-sm font-semibold text-foreground">¿Lo enviaste?</p>
              <div className="flex flex-wrap gap-2">
                <button type="button" disabled={busy} onClick={() => void onOutcome("whatsapp_sent")} className={adminActionButtonPrimary}><Check className="h-4 w-4" aria-hidden />Sí, enviado</button>
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
