"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { AlertTriangle, ArrowLeft, Mail, MapPin, Pencil, Phone, Search, Store, UserRound } from "lucide-react";

import { useGrowthLead } from "@/features/growth/hooks/useGrowthLead";
import { useGrowthMe } from "@/features/growth/hooks/useGrowthMe";
import { useGrowthTeam } from "@/features/growth/hooks/useGrowthTeam";
import { EmptyState } from "@/components/admin/EmptyState";
import { StatusBadge } from "@/components/admin/StatusBadge";
import { adminActionButtonSecondary } from "@/components/admin/actionButtonClasses";
import { ConfirmDialog } from "@/components/ui/ConfirmDialog";
import { LoadingBlock } from "@/components/ui/LoadingBlock";
import { Notification } from "@/components/ui/Notification";
import { FollowUpSheet } from "@/features/growth/components/admin/FollowUpSheet";
import { LeadConversation } from "@/features/growth/components/admin/LeadConversation";
import { LeadGiroSheet } from "@/features/growth/components/admin/LeadGiroSheet";
import { LeadPhoneSheet } from "@/features/growth/components/admin/LeadPhoneSheet";
import { LeadSummaryCard } from "@/features/growth/components/admin/LeadSummaryCard";
import { NextStepCard } from "@/features/growth/components/admin/NextStepCard";
import { PipelineStepper } from "@/features/growth/components/admin/PipelineStepper";
import { RegisterLeadSheet } from "@/features/growth/components/admin/RegisterLeadSheet";
import { ReplySheet } from "@/features/growth/components/admin/ReplySheet";
import { WhatsappComposer } from "@/features/growth/components/admin/WhatsappComposer";

import { buildMapsLink, buildMapsSearchLink } from "@/features/growth/helpers/buildWaLink";
import { formatBusinessName } from "@/features/growth/helpers/formatBusinessName";
import { buildLeadSummary } from "@/features/growth/helpers/leadSummary";
import { pipelineIndex } from "@/features/growth/helpers/leadPipeline";
import { backToLeads } from "@/features/growth/services/leadsReturn";
import { giroCopy } from "@/features/growth/constants/giroCopy";
import { LEAD_STAGE_META, NEXT_CHANNEL_LABEL } from "@/features/growth/constants/leadStages";
import { zoneByMunicipio } from "@/features/growth/constants/zoneCopy";
import { formatMexicanPhoneInput } from "@/lib/phone";

import type { StageAction } from "@/features/growth/constants/leadPipeline";
import type { FollowUpAction } from "@/features/growth/interfaces/lead";

const SHEET_ACTIONS: FollowUpAction[] = ["schedule_visit", "reschedule_visit", "remind", "pause", "note"];
const selectClass = "input-form min-h-11 rounded-xl border border-border bg-surface-raised px-3 text-sm text-foreground focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/20";

function Field({ label, value }: { label: string; value: string }) {
  return (
    <div className="grid gap-1 rounded-xl border border-border-soft bg-surface-raised px-3 py-2">
      <span className="text-xs text-muted-foreground">{label}</span>
      <span className="text-sm font-semibold text-foreground">{value}</span>
    </div>
  );
}

/** Everything about one prospect: who works it, what happened, what to send and what to do next. */
export function LeadDetailView({ id }: { id: string }) {
  const router = useRouter();
  const { detail, error, isLoading, busy, notice, clearNotice, markOutcome, followUp, updatePhone, updateGiro, logReply, reassign, refresh } = useGrowthLead(id);
  const { actor, isCoordinator } = useGrowthMe();
  const { team } = useGrowthTeam(isCoordinator);
  const [confirmDrop, setConfirmDrop] = useState(false);
  const [editingPhone, setEditingPhone] = useState(false);
  const [editingGiro, setEditingGiro] = useState(false);
  const [loggingReply, setLoggingReply] = useState(false);
  const [registering, setRegistering] = useState(false);
  const [sheetAction, setSheetAction] = useState<FollowUpAction | null>(null);

  if (isLoading && !detail) return <LoadingBlock message="Cargando prospecto…" variant="skeleton" />;
  if (error || !detail) return <EmptyState icon={AlertTriangle} title="No encontramos este prospecto" description="Puede que ya lo trabaje otra persona del equipo." tone="muted" />;

  const { lead, events, acquisition, canAct, suggestion } = detail;
  const stage = LEAD_STAGE_META[lead.stage];
  const closed = lead.stage === "registrado" || lead.stage === "descartado";
  const badPhone = lead.phone_status === "sin_whatsapp" || lead.phone_status === "equivocado";
  const canMessage = canAct && Boolean(lead.phone_e164) && !badPhone && lead.stage !== "descartado";
  const name = formatBusinessName(lead.business_name);
  const people = (team?.members ?? []).filter((member) => member.status !== "suspended");

  function handleAction(action: StageAction) {
    if (action === "not_interested") setConfirmDrop(true);
    else if (action === "register") setRegistering(true);
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
            <p className="inline-flex items-center gap-1 text-sm text-muted-foreground">
              <UserRound className="h-4 w-4 shrink-0" aria-hidden />
              {lead.owner_user_id ? `Lo trabaja ${lead.owner_user_id === actor?.userId ? "tú" : lead.owner_name ?? "alguien del equipo"}` : "Sin asignar: el primero que le escriba se lo queda"}
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            {pipelineIndex(lead.stage) < 0 ? <StatusBadge tone={stage.tone} label={stage.label} /> : null}
            {isCoordinator && people.length ? (
              <select
                aria-label="Reasignar"
                value={lead.owner_user_id ?? ""}
                disabled={busy}
                onChange={(event) => void reassign(event.target.value || null)}
                className={selectClass}
              >
                <option value="">Sin asignar</option>
                {people.map((member) => <option key={member.user_id} value={member.user_id}>{member.user_id === actor?.userId ? "Yo" : member.display_name}</option>)}
              </select>
            ) : null}
          </div>
        </div>
        <PipelineStepper stage={lead.stage} />
      </header>

      {!canAct ? <Notification tone="info" message={`Ahora lo trabaja ${lead.owner_name ?? "otra persona del equipo"}. Puedes ver su historial, pero ya no escribirle desde aquí.`} /> : null}

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-[minmax(0,1fr)_minmax(0,24rem)] lg:items-start">
        <aside className="grid min-w-0 gap-4 lg:sticky lg:top-20 lg:order-2 lg:max-h-[calc(100vh-6rem)] lg:overflow-y-auto">
          {canAct ? <NextStepCard lead={lead} busy={busy} reason={suggestion?.reason} onAction={handleAction} /> : null}
          {canMessage ? (
            <WhatsappComposer key={`${lead.phone_e164}-${lead.whatsapp_attempts}-${lead.phone_status}-${lead.stage}`} leadId={lead.id} busy={busy} onOutcome={(outcome, sent) => markOutcome(outcome, undefined, sent)} />
          ) : badPhone && !closed && canAct ? (
            <Notification tone="warning" title="WhatsApp" message="Ese número no sirve para WhatsApp. Si encontraste otro, usa «Corregir teléfono»." />
          ) : null}
        </aside>

        <div className="grid min-w-0 gap-4 lg:order-1">
          <LeadSummaryCard summary={buildLeadSummary(events)} />

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
              {!closed && canAct ? (
                <button type="button" disabled={busy} onClick={() => setEditingPhone(true)} className={adminActionButtonSecondary}><Pencil className="h-4 w-4" aria-hidden />Corregir teléfono</button>
              ) : null}
              {!closed && canAct ? (
                <button type="button" disabled={busy} onClick={() => setEditingGiro(true)} className={adminActionButtonSecondary}><Store className="h-4 w-4" aria-hidden />Corregir giro</button>
              ) : null}
            </div>
          </section>

          <LeadConversation events={events} viewerId={actor?.userId ?? null} onLogReply={() => setLoggingReply(true)} />
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
      <ReplySheet isOpen={loggingReply} businessName={name} busy={busy} onClose={() => setLoggingReply(false)} onSubmit={logReply} />
      <RegisterLeadSheet isOpen={registering} lead={lead} onClose={() => setRegistering(false)} onRegistered={() => void refresh()} />
    </div>
  );
}
