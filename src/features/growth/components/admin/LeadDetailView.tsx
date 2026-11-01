"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { AlertTriangle, ArrowLeft, MapPin, MoreHorizontal, Phone, PhoneOff, XCircle } from "lucide-react";

import { useGrowthLead } from "@/features/growth/hooks/useGrowthLead";
import { useGrowthMe } from "@/features/growth/hooks/useGrowthMe";
import { useGrowthTeam } from "@/features/growth/hooks/useGrowthTeam";
import { EmptyState } from "@/components/admin/EmptyState";
import { adminActionButtonIcon, adminActionButtonSecondary } from "@/components/admin/actionButtonClasses";
import { Notification } from "@/components/ui/Notification";
import { DropLeadSheet } from "@/features/growth/components/admin/DropLeadSheet";
import { FollowUpSheet } from "@/features/growth/components/admin/FollowUpSheet";
import { LeadActionsSheet } from "@/features/growth/components/admin/LeadActionsSheet";
import { LeadConversation } from "@/features/growth/components/admin/LeadConversation";
import { LeadDataCard } from "@/features/growth/components/admin/LeadDataCard";
import { LeadDetailSkeleton } from "@/features/growth/components/admin/LeadDetailSkeleton";
import { LeadGiroSheet } from "@/features/growth/components/admin/LeadGiroSheet";
import { LeadNowCard } from "@/features/growth/components/admin/LeadNowCard";
import { LeadOwnerSheet } from "@/features/growth/components/admin/LeadOwnerSheet";
import { LeadPhoneSheet } from "@/features/growth/components/admin/LeadPhoneSheet";
import { LeadQueueBar } from "@/features/growth/components/admin/LeadQueueBar";
import { LeadSummaryCard } from "@/features/growth/components/admin/LeadSummaryCard";
import { PipelineStepper } from "@/features/growth/components/admin/PipelineStepper";
import { RegisterLeadSheet } from "@/features/growth/components/admin/RegisterLeadSheet";
import { ReplySheet } from "@/features/growth/components/admin/ReplySheet";
import { TlacoAiLauncher } from "@/features/growth/components/admin/TlacoAiLauncher";

import { buildMapsLink, buildMapsSearchLink } from "@/features/growth/helpers/buildWaLink";
import { formatBusinessName } from "@/features/growth/helpers/formatBusinessName";
import { buildLeadSummary } from "@/features/growth/helpers/leadSummary";
import { canFollowUp } from "@/features/growth/helpers/leadPipeline";
import { forgetLastSent, readLastSent, rememberLastSent } from "@/features/growth/services/lastSent";
import { backToLeads } from "@/features/growth/services/leadsReturn";
import { giroCopy } from "@/features/growth/constants/giroCopy";
import { OPEN_STAGES, STAGE_ACTIONS } from "@/features/growth/constants/leadPipeline";
import { zoneByMunicipio } from "@/features/growth/constants/zoneCopy";

import type { StageAction } from "@/features/growth/constants/leadPipeline";
import type { FollowUpAction } from "@/features/growth/interfaces/lead";
import type { LeadActionGroup, LeadSheetAction } from "@/features/growth/interfaces/leadActions";

const SHEET_ACTIONS: LeadSheetAction[] = ["schedule_visit", "reschedule_visit", "remind", "pause", "note"];

/** Everything about one prospect: who it is, what to do now and what has happened. */
export function LeadDetailView({ id }: { id: string }) {
  const router = useRouter();
  const { detail, error, isLoading, busy, notice, clearNotice, markOutcome, followUp, updatePhone, updateGiro, logReply, reassign, refresh } = useGrowthLead(id);
  const { actor, isCoordinator } = useGrowthMe();
  const { team } = useGrowthTeam(isCoordinator);
  const [actionsOpen, setActionsOpen] = useState(false);
  const [confirmDrop, setConfirmDrop] = useState(false);
  const [editingPhone, setEditingPhone] = useState(false);
  const [editingGiro, setEditingGiro] = useState(false);
  const [editingOwner, setEditingOwner] = useState(false);
  const [loggingReply, setLoggingReply] = useState(false);
  const [registering, setRegistering] = useState(false);
  const [wantsMessage, setWantsMessage] = useState(false);
  const [sheetAction, setSheetAction] = useState<FollowUpAction | null>(null);
  const [justSent, setJustSent] = useState(false);

  useEffect(() => {
    setJustSent(readLastSent()?.leadId === id);
  }, [id]);

  if (isLoading && !detail) return <LeadDetailSkeleton />;
  if (error || !detail) return <EmptyState icon={AlertTriangle} title="No encontramos este prospecto" description="Puede que ya lo trabaje otra persona del equipo." tone="muted" />;

  const { lead, events, acquisition, canAct, suggestion } = detail;
  const now = new Date();
  const open = OPEN_STAGES.includes(lead.stage);
  const closed = !open;
  const badPhone = lead.phone_status === "sin_whatsapp" || lead.phone_status === "equivocado";
  const canMessage = canAct && Boolean(lead.phone_e164) && !badPhone && lead.stage !== "descartado";
  const showMessage = canMessage && (lead.stage !== "cita" || wantsMessage);
  const name = formatBusinessName(lead.business_name);
  const place = [lead.colonia ? formatBusinessName(lead.colonia) : null, zoneByMunicipio(lead.municipio)?.label ?? lead.municipio].filter(Boolean).join(", ");
  const people = (team?.members ?? []).filter((member) => member.status !== "suspended");
  const canEdit = canAct && !closed;
  const canReassign = isCoordinator && people.length > 0;
  const ownerLabel = lead.owner_user_id ? (lead.owner_user_id === actor?.userId ? "Tú" : lead.owner_name ?? "Alguien del equipo") : "Nadie todavía";
  const paused = Boolean(lead.snoozed_until && new Date(lead.snoozed_until) > now);
  const moves = canAct ? [...STAGE_ACTIONS[lead.stage], ...(paused ? (["resume"] as StageAction[]) : [])].filter((action) => canFollowUp(lead, action, now)) : [];

  const groups: LeadActionGroup[] = [
    { title: "Con el negocio", actions: [...moves.filter((action) => action !== "register"), ...(canMessage && !showMessage ? (["whatsapp"] as LeadSheetAction[]) : [])] },
    { title: "Datos", actions: canEdit ? ["phone", "giro"] : [] },
    { title: "Quién lo trabaja", actions: canReassign ? ["owner"] : [] },
    { title: "Cerrar", actions: [...(moves.includes("register") ? (["register"] as LeadSheetAction[]) : []), ...(canAct && open ? (["not_interested"] as LeadSheetAction[]) : [])] },
  ];
  const hasActions = groups.some((group) => group.actions.length);

  async function correctSend(outcome: "no_whatsapp" | "wrong_number") {
    setJustSent(false);
    forgetLastSent();
    await markOutcome(outcome);
  }

  function handleAction(action: LeadSheetAction) {
    setActionsOpen(false);
    if (action === "not_interested") setConfirmDrop(true);
    else if (action === "register") setRegistering(true);
    else if (action === "replied") setLoggingReply(true);
    else if (action === "whatsapp") setWantsMessage(true);
    else if (action === "phone") setEditingPhone(true);
    else if (action === "giro") setEditingGiro(true);
    else if (action === "owner") setEditingOwner(true);
    else if (SHEET_ACTIONS.includes(action)) setSheetAction(action as FollowUpAction);
    else void followUp({ action: action as FollowUpAction });
  }

  return (
    <div className="grid grid-cols-1 gap-4">
      <div className="flex items-center justify-between gap-2">
        <button type="button" onClick={() => backToLeads(router)} className="inline-flex min-h-11 w-fit items-center gap-2 text-sm font-semibold text-muted-foreground hover:text-foreground">
          <ArrowLeft className="h-4 w-4" aria-hidden />Prospectos
        </button>
        {hasActions ? (
          <button type="button" onClick={() => setActionsOpen(true)} aria-label="Acciones" className={adminActionButtonIcon}>
            <MoreHorizontal className="h-4 w-4" aria-hidden />
          </button>
        ) : null}
      </div>

      {justSent ? (
        <Notification
          tone="success"
          onDismiss={() => { setJustSent(false); forgetLastSent(); }}
          message={
            <span className="flex flex-wrap items-center gap-x-3 gap-y-1">
              <span>Quedó como enviado. ¿No se envió?</span>
              <span className="flex flex-wrap gap-1">
                <button type="button" disabled={busy} onClick={() => void correctSend("no_whatsapp")} className="inline-flex min-h-9 items-center gap-1 rounded-lg px-2 font-semibold hover:bg-emerald-100"><PhoneOff className="h-4 w-4" aria-hidden />No tiene WhatsApp</button>
                <button type="button" disabled={busy} onClick={() => void correctSend("wrong_number")} className="inline-flex min-h-9 items-center gap-1 rounded-lg px-2 font-semibold hover:bg-emerald-100"><XCircle className="h-4 w-4" aria-hidden />Número equivocado</button>
              </span>
            </span>
          }
        />
      ) : notice ? <Notification tone={notice.tone} message={notice.message} onDismiss={clearNotice} /> : null}

      <LeadQueueBar leadId={lead.id} done={justSent || notice?.tone === "success"} />

      <header className="flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
        <div className="grid min-w-0 gap-1.5 md:flex-1">
          <h2 className="text-xl font-bold tracking-tight text-foreground wrap-break-word sm:text-2xl">{name}</h2>
          <p className="text-sm text-muted-foreground">{giroCopy(lead.giro).label}{place ? ` · ${place}` : ""}</p>
          <PipelineStepper stage={lead.stage} />
        </div>
        <div className="flex gap-2 md:shrink-0">
          {lead.phone_e164 ? (
            <a href={`tel:${lead.phone_e164}`} className={`${adminActionButtonSecondary} flex-1 md:flex-none`}><Phone className="h-4 w-4" aria-hidden />Llamar</a>
          ) : null}
          <a href={lead.lat && lead.lng ? buildMapsLink(lead.lat, lead.lng) : buildMapsSearchLink(lead)} target="_blank" rel="noopener noreferrer" className={`${adminActionButtonSecondary} flex-1 md:flex-none`}>
            <MapPin className="h-4 w-4" aria-hidden />{lead.lat && lead.lng ? "Cómo llegar" : "Ver en Maps"}
          </a>
        </div>
      </header>

      {!canAct ? <Notification tone="info" message={`Ahora lo trabaja ${lead.owner_name ?? "otra persona del equipo"}. Puedes ver su historial, pero ya no escribirle desde aquí.`} /> : null}

      <div className={`grid grid-cols-1 gap-5 lg:items-start ${canAct ? "lg:grid-cols-[minmax(0,1fr)_minmax(0,24rem)]" : ""}`}>
        {canAct ? (
          <aside className="grid min-w-0 gap-3 lg:sticky lg:top-20 lg:order-2 lg:max-h-[calc(100vh-6rem)] lg:overflow-y-auto">
            <LeadNowCard
              lead={lead}
              busy={busy}
              reason={suggestion?.reason}
              showMessage={showMessage}
              onAction={handleAction}
              onOpenActions={() => setActionsOpen(true)}
              onOutcome={(outcome, sent) => {
                if (outcome === "whatsapp_sent") {
                  rememberLastSent({ leadId: lead.id, name });
                  setJustSent(true);
                }
                return markOutcome(outcome, undefined, sent);
              }}
            />
            {badPhone && !closed ? (
              <Notification tone="warning" title="WhatsApp" message="Ese número no sirve para WhatsApp. Si encontraste otro, corrígelo en «Datos»." />
            ) : !lead.phone_e164 && !closed ? (
              <Notification tone="info" title="Sin teléfono" message={`No podemos armarte el WhatsApp porque no tenemos su número.${lead.email ? " El motor le escribe por correo." : ""} Si lo consigues, agrégalo en «Datos».`} />
            ) : null}
          </aside>
        ) : null}

        <div className="grid min-w-0 gap-5 lg:order-1">
          <LeadSummaryCard summary={buildLeadSummary(events)} />
          <LeadConversation events={events} viewerId={actor?.userId ?? null} onLogReply={canAct ? () => setLoggingReply(true) : undefined} />
          <LeadDataCard lead={lead} acquisition={acquisition} ownerLabel={ownerLabel} canEdit={canEdit} canReassign={canReassign} onAction={handleAction} />
        </div>
      </div>

      <TlacoAiLauncher />
      <LeadActionsSheet isOpen={actionsOpen} busy={busy} groups={groups} onClose={() => setActionsOpen(false)} onPick={handleAction} />
      <DropLeadSheet
        isOpen={confirmDrop}
        businessName={name}
        busy={busy}
        onClose={() => setConfirmDrop(false)}
        onConfirm={async (reason) => {
          await markOutcome("not_interested", reason);
          setConfirmDrop(false);
        }}
      />
      <FollowUpSheet key={sheetAction ?? "closed"} action={sheetAction} businessName={name} busy={busy} onClose={() => setSheetAction(null)} onSubmit={followUp} />
      <LeadPhoneSheet isOpen={editingPhone} currentPhone={lead.phone_e164} busy={busy} onClose={() => setEditingPhone(false)} onSubmit={updatePhone} />
      <LeadGiroSheet key={lead.giro} isOpen={editingGiro} currentGiro={lead.giro} busy={busy} onClose={() => setEditingGiro(false)} onSubmit={updateGiro} />
      <LeadOwnerSheet key={`${lead.owner_user_id ?? "none"}-${editingOwner}`} isOpen={editingOwner} busy={busy} ownerId={lead.owner_user_id} actorId={actor?.userId ?? null} people={people} onClose={() => setEditingOwner(false)} onSubmit={reassign} />
      <ReplySheet
        isOpen={loggingReply}
        businessName={name}
        busy={busy}
        onClose={() => setLoggingReply(false)}
        onSubmit={(text) => (text ? logReply(text) : markOutcome(lead.email_status === "enviado" && lead.phone_status !== "enviado" ? "email_replied" : "whatsapp_replied"))}
      />
      <RegisterLeadSheet isOpen={registering} lead={lead} onClose={() => setRegistering(false)} onRegistered={() => void refresh()} />
    </div>
  );
}
