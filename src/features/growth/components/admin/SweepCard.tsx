"use client";

import { useEffect, useState } from "react";
import { ExternalLink, MapPin, MessageCircle, Pencil, Phone, RefreshCw, SkipForward, Sparkles } from "lucide-react";

import { useWhatsappDraft } from "@/features/growth/hooks/useWhatsappDraft";
import { StatusBadge } from "@/components/admin/StatusBadge";
import { adminActionButtonAi, adminActionButtonPrimary, adminActionButtonText } from "@/components/admin/actionButtonClasses";
import { ActionsMenu } from "@/components/ui/ActionsMenu";
import { LoadingBlock } from "@/components/ui/LoadingBlock";
import { Notification } from "@/components/ui/Notification";
import { AiWritingState } from "@/features/growth/components/admin/AiWritingState";
import { LeadPhoneSheet } from "@/features/growth/components/admin/LeadPhoneSheet";

import { buildMapsSearchLink } from "@/features/growth/helpers/buildWaLink";
import { formatBusinessName } from "@/features/growth/helpers/formatBusinessName";
import { sameTabOnPhones } from "@/features/growth/helpers/openWhatsapp";
import { giroCopy } from "@/features/growth/constants/giroCopy";
import { zoneByMunicipio } from "@/features/growth/constants/zoneCopy";
import { prefetchWhatsappDraft } from "@/features/growth/services/draftPrefetch";
import { patchLead } from "@/features/growth/services/growthClient";
import { formatMexicanPhoneInput } from "@/lib/phone";
import { leadPath } from "@/features/growth/constants/routes";

import type { SweepCardProps } from "@/features/growth/interfaces/sweep";

function typingTarget(target: EventTarget | null): boolean {
  return target instanceof HTMLElement && (target.isContentEditable || ["INPUT", "TEXTAREA", "SELECT"].includes(target.tagName));
}

/** One business at a time: the message is ready, one tap sends it and the next one appears. */
export function SweepCard({ lead, next, onSend, onSkip, onPhoneChanged }: SweepCardProps) {
  const composer = useWhatsappDraft(lead.id);
  const { draft } = composer;
  const [editing, setEditing] = useState(false);
  const [editingPhone, setEditingPhone] = useState(false);
  const [phoneBusy, setPhoneBusy] = useState(false);
  const [phoneError, setPhoneError] = useState<string | null>(null);
  const name = formatBusinessName(lead.business_name);
  const place = [lead.colonia ? formatBusinessName(lead.colonia) : null, zoneByMunicipio(lead.municipio)?.label ?? lead.municipio].filter(Boolean).join(", ");
  const variants = draft?.variants ?? [];
  const nextVariant = draft && variants.length > 1 ? variants[(variants.indexOf(draft.variant) + 1) % variants.length] : null;

  useEffect(() => {
    if (next) prefetchWhatsappDraft(next.id);
  }, [next]);

  function send() {
    onSend(composer.sent());
  }

  useEffect(() => {
    function onKey(event: KeyboardEvent) {
      if (editingPhone || event.metaKey || event.ctrlKey || event.altKey || typingTarget(event.target)) return;
      const key = event.key.toLowerCase();
      if (key === "w" && composer.waLink) {
        window.open(composer.waLink, "_blank", "noopener,noreferrer");
        onSend(composer.sent());
      } else if (key === "s") onSkip();
      else return;
      event.preventDefault();
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [composer, editingPhone, onSend, onSkip]);

  async function savePhone(phone: string): Promise<boolean> {
    setPhoneBusy(true);
    setPhoneError(null);
    try {
      const updated = await patchLead(lead.id, { phone });
      onPhoneChanged({ ...lead, phone_e164: updated.phone_e164, whatsapp_attempts: updated.whatsapp_attempts, last_whatsapp_at: updated.last_whatsapp_at });
      return true;
    } catch (err) {
      setPhoneError(err instanceof Error ? err.message : "No pudimos guardar el teléfono.");
      return false;
    } finally {
      setPhoneBusy(false);
    }
  }

  const more = [
    ...(lead.phone_e164 ? [{ label: `Llamar ${formatMexicanPhoneInput(lead.phone_e164)}`, icon: Phone, onClick: () => { window.location.href = `tel:${lead.phone_e164}`; } }] : []),
    { label: "Ver en Google Maps", icon: MapPin, onClick: () => window.open(buildMapsSearchLink(lead), "_blank", "noopener,noreferrer") },
    { label: "Corregir número", icon: Pencil, onClick: () => setEditingPhone(true) },
    { label: "Abrir su ficha", icon: ExternalLink, onClick: () => window.open(leadPath(lead.id), "_blank", "noopener,noreferrer") },
  ];

  return (
    <section className="grid gap-4 rounded-2xl border border-border bg-surface p-4 sm:p-5" aria-label={`Barrido: ${name}`}>
      <div className="flex items-start justify-between gap-3">
        <div className="grid min-w-0 gap-1">
          <h2 className="text-xl font-bold tracking-tight text-foreground wrap-break-word">{name}</h2>
          <p className="text-sm text-muted-foreground">
            {giroCopy(lead.giro).label} · {place}
            {lead.phone_e164 ? <span className="tabular-nums"> · {formatMexicanPhoneInput(lead.phone_e164)}</span> : null}
          </p>
        </div>
        <div className="flex shrink-0 items-center gap-2">
          <StatusBadge tone={lead.whatsapp_attempts > 0 ? "info" : "neutral"} label={lead.whatsapp_attempts > 0 ? "Seguimiento" : "Primer mensaje"} compact />
          <ActionsMenu items={more} aria-label="Más acciones" />
        </div>
      </div>

      {phoneError ? <Notification tone="error" message={phoneError} onDismiss={() => setPhoneError(null)} /> : null}
      {composer.error ? <Notification tone="error" message={composer.error} /> : null}
      {composer.loading && !draft ? <LoadingBlock message="Armando el mensaje…" variant="skeleton" /> : null}

      {composer.aiBusy && !composer.aiWritten ? <AiWritingState /> : draft ? (
        editing ? (
          <textarea
            aria-label="Mensaje"
            value={composer.text}
            onChange={(event) => composer.setText(event.target.value)}
            rows={8}
            autoFocus
            className="input-form min-h-44 w-full resize-y rounded-xl border border-border-soft bg-surface-raised p-3 text-sm leading-relaxed text-foreground focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/20"
          />
        ) : (
          <button type="button" onClick={() => setEditing(true)} className="line-clamp-4 w-full cursor-text whitespace-pre-wrap rounded-xl border border-border-soft bg-surface-raised p-3 text-left text-sm leading-relaxed text-foreground hover:border-accent/40" title="Toca para editar">
            {composer.text}
          </button>
        )
      ) : null}

      {draft ? (
        <div className="-mt-2 flex flex-wrap items-center gap-1">
          <button type="button" disabled={composer.aiBusy} onClick={() => setEditing((value) => !value)} className={adminActionButtonText}>
            <Pencil className="h-4 w-4" aria-hidden />{editing ? "Listo" : "Editar"}
          </button>
          {nextVariant ? (
            <button type="button" disabled={composer.loading || composer.aiBusy} onClick={() => { setEditing(false); void composer.selectVariant(nextVariant); }} className={adminActionButtonText}>
              <RefreshCw className="h-4 w-4" aria-hidden />Otro mensaje ({variants.indexOf(draft.variant) + 1} de {variants.length})
            </button>
          ) : null}
          {lead.whatsapp_attempts > 0 ? (
            <button type="button" disabled={composer.aiBusy || composer.loading} onClick={() => { setEditing(false); void composer.writeWithAi(); }} className={`${adminActionButtonAi} ${composer.aiBusy ? "ai-busy" : ""}`}>
              <Sparkles className={`h-4 w-4 ${composer.aiBusy ? "motion-safe:animate-spin" : ""}`} aria-hidden />{composer.aiBusy ? "Escribiendo…" : "Escribir con IA"}
            </button>
          ) : null}
          {composer.aiWritten ? <span className="text-xs text-muted-foreground">Escrito con IA: revísalo antes de enviar.</span> : composer.edited ? <span className="text-xs text-muted-foreground">Se enviará tal como lo editaste.</span> : null}
        </div>
      ) : null}

      <div className="sticky bottom-0 -mx-4 grid gap-1 border-t border-border-soft bg-surface px-4 pb-[max(1rem,env(safe-area-inset-bottom))] pt-3 sm:static sm:mx-0 sm:border-0 sm:p-0">
        {composer.waLink ? (
          <a
            href={composer.waLink}
            target="_blank"
            rel="noopener noreferrer"
            aria-disabled={composer.aiBusy}
            onClick={(event) => {
              if (composer.aiBusy) {
                event.preventDefault();
                return;
              }
              send();
              sameTabOnPhones(event);
            }}
            className={`${adminActionButtonPrimary} min-h-14 w-full text-base ${composer.aiBusy ? "pointer-events-none opacity-60" : ""}`}
          >
            <MessageCircle className="h-5 w-5" aria-hidden />Enviar por WhatsApp
          </a>
        ) : null}
        <button type="button" onClick={onSkip} className={adminActionButtonText}>
          <SkipForward className="h-4 w-4" aria-hidden />Saltar por ahora
        </button>
        {next ? <p className="truncate text-center text-xs text-muted-foreground">Sigue: <span className="font-semibold text-foreground">{formatBusinessName(next.business_name)}</span></p> : null}
        <p className="hidden text-center text-xs text-muted-foreground md:block">Teclas: W enviar · S saltar</p>
      </div>

      <LeadPhoneSheet isOpen={editingPhone} currentPhone={lead.phone_e164} busy={phoneBusy} onClose={() => setEditingPhone(false)} onSubmit={savePhone} />
    </section>
  );
}
