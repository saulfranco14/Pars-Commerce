"use client";

import { useState } from "react";
import Link from "next/link";
import { AlertTriangle, ArrowLeft, Mail, MapPin, Pencil, Phone, Search } from "lucide-react";

import { useGrowthLead } from "@/features/growth/hooks/useGrowthLead";
import { EmptyState } from "@/components/admin/EmptyState";
import { StatusBadge } from "@/components/admin/StatusBadge";
import { adminActionButtonDanger, adminActionButtonSecondary } from "@/components/admin/actionButtonClasses";
import { ConfirmDialog } from "@/components/ui/ConfirmDialog";
import { LoadingBlock } from "@/components/ui/LoadingBlock";
import { Notification } from "@/components/ui/Notification";
import { LeadPhoneSheet } from "@/features/growth/components/admin/LeadPhoneSheet";
import { WhatsappComposer } from "@/features/growth/components/admin/WhatsappComposer";

import { buildMapsLink, buildMapsSearchLink } from "@/features/growth/helpers/buildWaLink";
import { suggestWhatsappStep } from "@/features/growth/helpers/suggestWhatsappStep";
import { giroCopy } from "@/features/growth/constants/giroCopy";
import { LEAD_EVENT_LABEL, LEAD_STAGE_META, NEXT_CHANNEL_LABEL } from "@/features/growth/constants/leadStages";
import { zoneByMunicipio } from "@/features/growth/constants/zoneCopy";
import { formatMexicanPhoneInput } from "@/lib/phone";

const ACTOR_LABEL: Record<string, string> = { system: "Motor", operator: "Tú", prospect: "Negocio" };

function when(value: string): string {
  return new Date(value).toLocaleString("es-MX", { day: "2-digit", month: "short", hour: "2-digit", minute: "2-digit" });
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
  const { detail, error, isLoading, busy, notice, clearNotice, markOutcome, snooze, updatePhone } = useGrowthLead(id);
  const [confirmDrop, setConfirmDrop] = useState(false);
  const [editingPhone, setEditingPhone] = useState(false);

  if (isLoading && !detail) return <LoadingBlock message="Cargando prospecto…" variant="skeleton" />;
  if (error || !detail) return <EmptyState icon={AlertTriangle} title="No encontramos este prospecto" tone="muted" />;

  const { lead, events, acquisition } = detail;
  const stage = LEAD_STAGE_META[lead.stage];
  const closed = lead.stage === "registrado" || lead.stage === "descartado";
  const whatsappSuggestion = suggestWhatsappStep(lead);

  return (
    <div className="grid gap-5">
      <Link href="/dashboard/plataforma/prospectos" className="inline-flex min-h-11 items-center gap-2 text-sm font-semibold text-muted-foreground hover:text-foreground">
        <ArrowLeft className="h-4 w-4" aria-hidden />Prospectos
      </Link>
      {notice ? <Notification tone={notice.tone} message={notice.message} onDismiss={clearNotice} /> : null}

      <section className="grid gap-4 rounded-2xl border border-border bg-surface p-4 sm:p-5">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div className="grid gap-1">
            <h2 className="text-xl font-bold tracking-tight text-foreground">{lead.business_name}</h2>
            <p className="inline-flex items-center gap-1 text-sm text-muted-foreground">
              <MapPin className="h-4 w-4" aria-hidden />
              {giroCopy(lead.giro).label} · {[lead.address, lead.colonia, zoneByMunicipio(lead.municipio)?.label ?? lead.municipio].filter(Boolean).join(", ")}
            </p>
          </div>
          <StatusBadge tone={stage.tone} label={stage.label} />
        </div>
        <div className="grid gap-2 sm:grid-cols-4">
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
          {lead.email ? <a href={`mailto:${lead.email}`} className={adminActionButtonSecondary}><Mail className="h-4 w-4" aria-hidden />{lead.email}</a> : null}
          {lead.lat && lead.lng ? (
            <a href={buildMapsLink(lead.lat, lead.lng)} target="_blank" rel="noopener noreferrer" className={adminActionButtonSecondary}><MapPin className="h-4 w-4" aria-hidden />Cómo llegar</a>
          ) : null}
          <a href={buildMapsSearchLink(lead)} target="_blank" rel="noopener noreferrer" className={adminActionButtonSecondary}><Search className="h-4 w-4" aria-hidden />Ver en Google Maps</a>
          {!closed ? (
            <button type="button" disabled={busy} onClick={() => setEditingPhone(true)} className={adminActionButtonSecondary}><Pencil className="h-4 w-4" aria-hidden />Corregir teléfono</button>
          ) : null}
        </div>
        {!closed ? (
          <div className="flex flex-wrap gap-2 border-t border-border-soft pt-4">
            <button type="button" disabled={busy} onClick={() => markOutcome(lead.email_status === "enviado" ? "email_replied" : "whatsapp_replied")} className={adminActionButtonSecondary}>Marcar que respondió</button>
            <button type="button" disabled={busy} onClick={() => snooze(lead.snoozed_until ? null : 30)} className={adminActionButtonSecondary}>{lead.snoozed_until ? "Reactivar" : "Pausar 30 días"}</button>
            <button type="button" disabled={busy} onClick={() => setConfirmDrop(true)} className={adminActionButtonDanger}>No le interesa</button>
          </div>
        ) : null}
      </section>

      {whatsappSuggestion.step ? (
        <WhatsappComposer key={`${lead.phone_e164}-${lead.whatsapp_attempts}-${lead.phone_status}`} leadId={lead.id} busy={busy} onOutcome={(outcome) => markOutcome(outcome)} />
      ) : lead.phone_e164 && !closed ? (
        <Notification tone="warning" title="WhatsApp" message={whatsappSuggestion.reason} />
      ) : null}

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
                  {event.template_label ? ` · ${event.template_label}` : ""}
                  {typeof event.payload.reason === "string" ? ` · ${event.payload.reason}` : ""}
                  {typeof event.payload.seconds === "number" ? ` · ${Math.round(event.payload.seconds)} s` : ""}
                </span>
              </li>
            ))}
          </ol>
        )}
      </section>

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
      <LeadPhoneSheet
        isOpen={editingPhone}
        currentPhone={lead.phone_e164}
        busy={busy}
        onClose={() => setEditingPhone(false)}
        onSubmit={updatePhone}
      />
    </div>
  );
}
