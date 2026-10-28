"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { AlertTriangle, ArrowLeft, Mail, MapPin, Pencil, Phone, Search, Store } from "lucide-react";

import { useGrowthLead } from "@/features/growth/hooks/useGrowthLead";
import { EmptyState } from "@/components/admin/EmptyState";
import { StatusBadge } from "@/components/admin/StatusBadge";
import { adminActionButtonSecondary } from "@/components/admin/actionButtonClasses";
import { ConfirmDialog } from "@/components/ui/ConfirmDialog";
import { LoadingBlock } from "@/components/ui/LoadingBlock";
import { Notification } from "@/components/ui/Notification";
import { FollowUpSheet } from "@/features/growth/components/admin/FollowUpSheet";
import { LeadGiroSheet } from "@/features/growth/components/admin/LeadGiroSheet";
import { LeadPhoneSheet } from "@/features/growth/components/admin/LeadPhoneSheet";
import { NextStepCard } from "@/features/growth/components/admin/NextStepCard";
import { PipelineStepper } from "@/features/growth/components/admin/PipelineStepper";
import { WhatsappComposer } from "@/features/growth/components/admin/WhatsappComposer";

import { buildMapsLink, buildMapsSearchLink } from "@/features/growth/helpers/buildWaLink";
import { formatBusinessName } from "@/features/growth/helpers/formatBusinessName";
import { formatDayTime, pipelineIndex } from "@/features/growth/helpers/leadPipeline";
import { formatVisitSeconds, paraEventDetail } from "@/features/growth/helpers/paraSession";
import { suggestWhatsappStep } from "@/features/growth/helpers/suggestWhatsappStep";
import { backToLeads } from "@/features/growth/services/leadsReturn";
import { giroCopy } from "@/features/growth/constants/giroCopy";
import { LEAD_EVENT_LABEL, LEAD_STAGE_META, NEXT_CHANNEL_LABEL } from "@/features/growth/constants/leadStages";
import { zoneByMunicipio } from "@/features/growth/constants/zoneCopy";
import { formatMexicanPhoneInput } from "@/lib/phone";

import type { StageAction } from "@/features/growth/constants/leadPipeline";
import type { FollowUpAction, LeadEvent } from "@/features/growth/interfaces/lead";

const ACTOR_LABEL: Record<string, string> = { system: "Motor", operator: "Tú", prospect: "Negocio" };
const SHEET_ACTIONS: FollowUpAction[] = ["schedule_visit", "reschedule_visit", "remind", "pause", "note"];

function when(value: string): string {
  return new Date(value).toLocaleString("es-MX", { day: "2-digit", month: "short", hour: "2-digit", minute: "2-digit" });
}

function eventDetail(event: LeadEvent): string {
  const { payload } = event;
  const parts = [
    event.template_label,
    event.type === "giro_corrected" && typeof payload.giro === "string" ? `${giroCopy(String(payload.previous)).label} → ${giroCopy(payload.giro).label}` : null,
    typeof payload.at === "string" ? formatDayTime(payload.at) : null,
    typeof payload.reason === "string" ? payload.reason : null,
    typeof payload.seconds === "number" ? formatVisitSeconds(payload.seconds) : null,
  ].filter(Boolean);
  return `${parts.length ? ` · ${parts.join(" · ")}` : ""}${paraEventDetail(event.type, payload)}`;
}

function Field({ label, value }: { label: string; value: string }) {
  return (
    <div className="grid gap-1 rounded-xl border border-border-soft bg-surface-raised px-3 py-2">
      <span className="text-xs text-muted-foreground">{label}</span>
      <span className="text-sm font-semibold text-foreground">{value}</span>
    </div>
  );
}

export function LeadDetailView({ id }: { id: string }) {
  const router = useRouter();
  const { detail, error, isLoading, busy, notice, clearNotice, markOutcome, followUp, updatePhone, updateGiro } = useGrowthLead(id);
  const [confirmDrop, setConfirmDrop] = useState(false);
  const [editingPhone, setEditingPhone] = useState(false);
  const [editingGiro, setEditingGiro] = useState(false);
  const [sheetAction, setSheetAction] = useState<FollowUpAction | null>(null);

  if (isLoading && !detail) return <LoadingBlock message="Cargando prospecto…" variant="skeleton" />;
  if (error || !detail) return <EmptyState icon={AlertTriangle} title="No encontramos este prospecto" tone="muted" />;

  const { lead, events, acquisition } = detail;
  const stage = LEAD_STAGE_META[lead.stage];
  const closed = lead.stage === "registrado" || lead.stage === "descartado";
  const whatsappSuggestion = suggestWhatsappStep(lead);
  const name = formatBusinessName(lead.business_name);

  function handleAction(action: StageAction) {
    if (action === "not_interested") setConfirmDrop(true);
    else if (action === "replied") void markOutcome(lead.email_status === "enviado" && lead.phone_status !== "enviado" ? "email_replied" : "whatsapp_replied");
    else if (SHEET_ACTIONS.includes(action)) setSheetAction(action);
    else void followUp({ action });
  }

  return (
    <div className="grid grid-cols-1 gap-4">
      <button type="button" onClick={() => backToLeads(router)} className="inline-flex min-h-11 w-fit items-center gap-2 text-sm font-semibold text-muted-foreground hover:text-foreground">
        <ArrowLeft className="h-4 w-4" aria-hidden />Prospectos
      </button>
      {notice ? <Notification tone={notice.tone} message={notice.message} onDismiss={clearNotice} /> : null}

      <header className="grid gap-3">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div className="grid min-w-0 gap-1">
            <h2 className="text-xl font-bold tracking-tight text-foreground wrap-break-word sm:text-2xl">{name}</h2>
            <p className="inline-flex items-center gap-1 text-sm text-muted-foreground">
              <MapPin className="h-4 w-4 shrink-0" aria-hidden />
              {giroCopy(lead.giro).label} · {[lead.address, lead.colonia, zoneByMunicipio(lead.municipio)?.label ?? lead.municipio].filter(Boolean).join(", ")}
            </p>
          </div>
          {pipelineIndex(lead.stage) < 0 ? <StatusBadge tone={stage.tone} label={stage.label} /> : null}
        </div>
        <PipelineStepper stage={lead.stage} />
      </header>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-[minmax(0,1fr)_minmax(0,24rem)] lg:items-start">
        <aside className="grid min-w-0 gap-4 lg:sticky lg:top-20 lg:order-2 lg:max-h-[calc(100vh-6rem)] lg:overflow-y-auto">
          <NextStepCard lead={lead} busy={busy} onAction={handleAction} />
          {whatsappSuggestion.step ? (
            <WhatsappComposer key={`${lead.phone_e164}-${lead.whatsapp_attempts}-${lead.phone_status}`} leadId={lead.id} busy={busy} onOutcome={(outcome) => markOutcome(outcome)} />
          ) : lead.phone_e164 && !closed ? (
            <Notification tone="warning" title="WhatsApp" message={whatsappSuggestion.reason} />
          ) : null}
        </aside>

        <div className="grid min-w-0 gap-4 lg:order-1">
          <section className="grid gap-4 rounded-2xl border border-border bg-surface p-4 sm:p-5">
            <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
              <Field label="Siguiente canal" value={NEXT_CHANNEL_LABEL[lead.next_channel]} />
              <Field label="WhatsApp" value={`${lead.phone_status} · ${lead.whatsapp_attempts} intento(s)`} />
              <Field label="Correo" value={lead.email ? lead.email_status : "Sin correo"} />
              <Field label="Visita" value={`${lead.visit_status} · ${lead.visit_attempts} intento(s)`} />
            </div>
            {acquisition ? (
              <Notification tone="success" message={`Se registró · ${acquisition.bucket === "engine" ? "motor" : acquisition.bucket === "assisted" ? "asistido" : "solo"}${acquisition.channel ? ` por ${acquisition.channel}` : ""}.`} />
            ) : null}
            <div className="flex flex-wrap gap-2">
              {lead.phone_e164 ? (
                <a href={`tel:${lead.phone_e164}`} className={adminActionButtonSecondary}><Phone className="h-4 w-4" aria-hidden />Llamar {formatMexicanPhoneInput(lead.phone_e164)}</a>
              ) : null}
              {lead.email ? <a href={`mailto:${lead.email}`} className={`${adminActionButtonSecondary} max-w-full`}><Mail className="h-4 w-4 shrink-0" aria-hidden /><span className="truncate">{lead.email}</span></a> : null}
              {lead.lat && lead.lng ? (
                <a href={buildMapsLink(lead.lat, lead.lng)} target="_blank" rel="noopener noreferrer" className={adminActionButtonSecondary}><MapPin className="h-4 w-4" aria-hidden />Cómo llegar</a>
              ) : null}
              <a href={buildMapsSearchLink(lead)} target="_blank" rel="noopener noreferrer" className={adminActionButtonSecondary}><Search className="h-4 w-4" aria-hidden />Ver en Google Maps</a>
              {!closed ? (
                <button type="button" disabled={busy} onClick={() => setEditingPhone(true)} className={adminActionButtonSecondary}><Pencil className="h-4 w-4" aria-hidden />Corregir teléfono</button>
              ) : null}
              {!closed ? (
                <button type="button" disabled={busy} onClick={() => setEditingGiro(true)} className={adminActionButtonSecondary}><Store className="h-4 w-4" aria-hidden />Corregir giro</button>
              ) : null}
            </div>
          </section>

          <section className="grid gap-3 rounded-2xl border border-border bg-surface p-4 sm:p-5">
            <h3 className="text-base font-bold text-foreground">Línea de tiempo</h3>
            {events.length === 0 ? (
              <p className="text-sm text-muted-foreground">Todavía no hay actividad con este negocio.</p>
            ) : (
              <ol className="grid gap-2">
                {events.map((event) => (
                  <li key={event.id} className="grid grid-cols-[96px_minmax(0,1fr)] gap-3 text-sm">
                    <time className="font-mono text-xs text-muted-foreground">{when(event.created_at)}</time>
                    <span className="text-foreground">
                      <span className="mr-2 rounded-md bg-border-soft/60 px-1.5 py-0.5 text-[11px] font-bold uppercase text-muted-foreground">{ACTOR_LABEL[event.actor] ?? event.actor}</span>
                      {LEAD_EVENT_LABEL[event.type] ?? event.type}
                      {eventDetail(event)}
                      {typeof event.payload.note === "string" ? <span className="mt-1 block rounded-lg bg-border-soft/50 px-2 py-1 text-muted-foreground">“{event.payload.note}”</span> : null}
                    </span>
                  </li>
                ))}
              </ol>
            )}
          </section>
        </div>
      </div>

      <ConfirmDialog
        isOpen={confirmDrop}
        onClose={() => setConfirmDrop(false)}
        onConfirm={async () => {
          await markOutcome("not_interested", "rechazo");
          setConfirmDrop(false);
        }}
        title="¿Marcar que no le interesa?"
        description="Se da de baja en WhatsApp, correo y visitas, y nunca se le vuelve a escribir."
        confirmLabel="Sí, dar de baja"
        variant="danger"
        loading={busy}
      />
      <FollowUpSheet key={sheetAction ?? "closed"} action={sheetAction} businessName={name} busy={busy} onClose={() => setSheetAction(null)} onSubmit={followUp} />
      <LeadPhoneSheet isOpen={editingPhone} currentPhone={lead.phone_e164} busy={busy} onClose={() => setEditingPhone(false)} onSubmit={updatePhone} />
      <LeadGiroSheet key={lead.giro} isOpen={editingGiro} currentGiro={lead.giro} busy={busy} onClose={() => setEditingGiro(false)} onSubmit={updateGiro} />
    </div>
  );
}
