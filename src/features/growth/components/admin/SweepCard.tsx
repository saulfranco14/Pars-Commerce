"use client";

import { useEffect, useState } from "react";
import { Check, ExternalLink, MessageCircle, Pencil, Phone, PhoneOff, Search, SkipForward, XCircle } from "lucide-react";

import { useWhatsappDraft } from "@/features/growth/hooks/useWhatsappDraft";
import { StatusBadge } from "@/components/admin/StatusBadge";
import { adminActionButtonPrimary, adminActionButtonSecondary } from "@/components/admin/actionButtonClasses";
import { FilterTabs } from "@/components/ui/FilterTabs";
import { LoadingBlock } from "@/components/ui/LoadingBlock";
import { Notification } from "@/components/ui/Notification";
import { LeadPhoneSheet } from "@/features/growth/components/admin/LeadPhoneSheet";

import { buildMapsSearchLink } from "@/features/growth/helpers/buildWaLink";
import { formatBusinessName } from "@/features/growth/helpers/formatBusinessName";
import { sameTabOnPhones } from "@/features/growth/helpers/openWhatsapp";
import { giroCopy } from "@/features/growth/constants/giroCopy";
import { zoneByMunicipio } from "@/features/growth/constants/zoneCopy";
import { patchLead } from "@/features/growth/services/growthClient";
import { forgetWhatsappOpened } from "@/features/growth/services/whatsappOpened";
import { formatMexicanPhoneInput } from "@/lib/phone";
import { leadPath } from "@/features/growth/constants/routes";

import type { SweepCardProps } from "@/features/growth/interfaces/sweep";
import type { TemplateVariant } from "@/features/growth/interfaces/template";

const linkButton = "inline-flex min-h-11 items-center gap-1.5 text-sm font-semibold text-accent hover:underline";

function typingTarget(target: EventTarget | null): boolean {
  return target instanceof HTMLElement && (target.isContentEditable || ["INPUT", "TEXTAREA", "SELECT"].includes(target.tagName));
}

export function SweepCard({ lead, next, onOutcome, onSkip, onPhoneChanged }: SweepCardProps) {
  const composer = useWhatsappDraft(lead.id);
  const { draft, opened } = composer;
  const [editingPhone, setEditingPhone] = useState(false);
  const [phoneBusy, setPhoneBusy] = useState(false);
  const [phoneError, setPhoneError] = useState<string | null>(null);
  const name = formatBusinessName(lead.business_name);
  const place = [lead.colonia ? formatBusinessName(lead.colonia) : null, zoneByMunicipio(lead.municipio)?.label ?? lead.municipio].filter(Boolean).join(", ");

  useEffect(() => {
    function onKey(event: KeyboardEvent) {
      if (editingPhone || event.metaKey || event.ctrlKey || event.altKey || typingTarget(event.target)) return;
      const key = event.key.toLowerCase();
      if (key === "w" && draft) {
        window.open(draft.waLink, "_blank", "noopener,noreferrer");
        composer.markOpened();
      } else if (key === "e" && opened) onOutcome("whatsapp_sent");
      else if (key === "n" && opened) onOutcome("no_whatsapp");
      else if (key === "x" && opened) onOutcome("wrong_number");
      else if (key === "s") onSkip();
      else return;
      event.preventDefault();
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [composer, draft, editingPhone, onOutcome, onSkip, opened]);

  async function savePhone(phone: string): Promise<boolean> {
    setPhoneBusy(true);
    setPhoneError(null);
    try {
      const updated = await patchLead(lead.id, { phone });
      forgetWhatsappOpened();
      onPhoneChanged({ ...lead, phone_e164: updated.phone_e164, whatsapp_attempts: updated.whatsapp_attempts, last_whatsapp_at: updated.last_whatsapp_at });
      return true;
    } catch (err) {
      setPhoneError(err instanceof Error ? err.message : "No pudimos guardar el teléfono.");
      return false;
    } finally {
      setPhoneBusy(false);
    }
  }

  const openLink = draft ? (
    <a
      href={draft.waLink}
      target="_blank"
      rel="noopener noreferrer"
      onClick={(event) => {
        composer.markOpened();
        sameTabOnPhones(event);
      }}
      className={opened ? linkButton : `${adminActionButtonPrimary} min-h-14 w-full text-base`}
    >
      <MessageCircle className="h-5 w-5" aria-hidden />
      {opened ? "Abrir WhatsApp otra vez" : "Abrir WhatsApp"}
    </a>
  ) : null;

  return (
    <section className="grid gap-4 rounded-2xl border border-border bg-surface p-4 sm:p-5 lg:grid-cols-[minmax(0,1fr)_20rem] lg:gap-6" aria-label={`Barrido: ${name}`}>
      <div className="grid min-w-0 content-start gap-4">
        <div className="flex items-start justify-between gap-3">
          <div className="grid min-w-0 gap-1">
            <h2 className="text-xl font-bold tracking-tight text-foreground wrap-break-word">{name}</h2>
            <p className="text-sm text-muted-foreground">{giroCopy(lead.giro).label} · {place}</p>
            {lead.phone_e164 ? (
              <a href={`tel:${lead.phone_e164}`} className="inline-flex w-fit items-center gap-1.5 text-base font-semibold tabular-nums text-foreground">
                <Phone className="h-4 w-4 text-muted-foreground" aria-hidden />{formatMexicanPhoneInput(lead.phone_e164)}
              </a>
            ) : null}
          </div>
          <StatusBadge tone={lead.whatsapp_attempts > 0 ? "info" : "neutral"} label={lead.whatsapp_attempts > 0 ? "Seguimiento" : "Primer mensaje"} compact />
        </div>
  
        <div className="flex flex-wrap gap-x-4 gap-y-1">
          <a href={buildMapsSearchLink(lead)} target="_blank" rel="noopener noreferrer" className={linkButton}><Search className="h-4 w-4" aria-hidden />Ver en Maps</a>
          <button type="button" onClick={() => setEditingPhone(true)} className={linkButton}><Pencil className="h-4 w-4" aria-hidden />Corregir número</button>
          <a href={leadPath(lead.id)} target="_blank" rel="noopener noreferrer" className={linkButton}><ExternalLink className="h-4 w-4" aria-hidden />Ficha</a>
        </div>
  
        {phoneError ? <Notification tone="error" message={phoneError} onDismiss={() => setPhoneError(null)} /> : null}
        {composer.error ? <Notification tone="error" message={composer.error} /> : null}
  
        {draft && draft.variants.length > 1 ? (
          <FilterTabs
            tabs={draft.variants.map((variant) => ({ value: variant, label: `Mensaje ${variant}` }))}
            activeValue={draft.variant}
            onTabChange={(value) => composer.selectVariant(value as TemplateVariant)}
            ariaLabel="Variante del mensaje"
            disabled={composer.loading}
          />
        ) : null}
        {composer.loading && !draft ? <LoadingBlock message="Armando el mensaje…" variant="skeleton" /> : null}
        {draft ? (
          <p className={`max-h-56 overflow-y-auto whitespace-pre-wrap rounded-xl border border-border-soft bg-surface-raised p-3 text-sm leading-relaxed text-foreground sm:max-h-none lg:max-h-[calc(100vh-32rem)] ${composer.loading ? "opacity-60" : ""}`}>
            {draft.body}
          </p>
        ) : null}
      </div>

      <div className="sticky bottom-0 -mx-4 grid content-start gap-2 border-t border-border-soft bg-surface px-4 pb-[max(1rem,env(safe-area-inset-bottom))] pt-3 sm:static sm:mx-0 sm:border-0 sm:p-0 lg:sticky lg:top-20 lg:self-start lg:border-l lg:pl-6">
        {opened ? (
          <>
            <p className="text-sm font-semibold text-foreground">¿Cómo te fue con {name}?</p>
            <button type="button" onClick={() => onOutcome("whatsapp_sent")} className={`${adminActionButtonPrimary} min-h-14 w-full text-base`}>
              <Check className="h-5 w-5" aria-hidden />Enviado
            </button>
            <div className="grid grid-cols-2 gap-2">
              <button type="button" onClick={() => onOutcome("no_whatsapp")} className={adminActionButtonSecondary}><PhoneOff className="h-4 w-4" aria-hidden />Sin WhatsApp</button>
              <button type="button" onClick={() => onOutcome("wrong_number")} className={adminActionButtonSecondary}><XCircle className="h-4 w-4" aria-hidden />Equivocado</button>
            </div>
            <div className="flex flex-wrap items-center justify-between gap-2">
              {openLink}
              <button type="button" onClick={onSkip} className="inline-flex min-h-11 items-center gap-1.5 text-sm font-semibold text-muted-foreground hover:text-foreground">
                <SkipForward className="h-4 w-4" aria-hidden />Saltar
              </button>
            </div>
          </>
        ) : (
          <>
            {openLink}
            <button type="button" onClick={onSkip} className={`${adminActionButtonSecondary} w-full`}>
              <SkipForward className="h-4 w-4" aria-hidden />Saltar por ahora
            </button>
          </>
        )}
        {next ? (
          <p className="hidden truncate border-t border-border-soft pt-3 text-sm text-muted-foreground lg:block">
            Sigue: <span className="font-semibold text-foreground">{formatBusinessName(next.business_name)}</span>
          </p>
        ) : null}
        <p className="hidden text-xs text-muted-foreground md:block">Teclas: W abrir · E enviado · N sin WhatsApp · X equivocado · S saltar</p>
      </div>

      <LeadPhoneSheet isOpen={editingPhone} currentPhone={lead.phone_e164} busy={phoneBusy} onClose={() => setEditingPhone(false)} onSubmit={savePhone} />
    </section>
  );
}
