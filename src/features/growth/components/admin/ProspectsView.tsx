"use client";

import { useEffect, useState } from "react";
import dynamic from "next/dynamic";
import Link from "next/link";
import { HelpCircle, MessageCircle, Play, Plus } from "lucide-react";

import { useActivationBoard } from "@/features/growth/hooks/useActivationBoard";
import { useGrowthMe } from "@/features/growth/hooks/useGrowthMe";
import { useGrowthTeam } from "@/features/growth/hooks/useGrowthTeam";
import { useGuideOnce } from "@/features/growth/hooks/useGuideOnce";
import { useLeadBoard } from "@/features/growth/hooks/useLeadBoard";
import { useMyDay } from "@/features/growth/hooks/useMyDay";
import { useProspectFilters } from "@/features/growth/hooks/useProspectFilters";
import { adminActionButtonIcon, adminActionButtonPrimary, adminActionButtonSecondary, adminActionButtonText } from "@/components/admin/actionButtonClasses";
import { LoadingBlock } from "@/components/ui/LoadingBlock";
import { FollowUpView } from "@/features/growth/components/admin/FollowUpView";
import { NewLeadSheet } from "@/features/growth/components/admin/NewLeadSheet";
import { ProspectingGuide } from "@/features/growth/components/admin/ProspectingGuide";
import { ProspectsActionBar } from "@/features/growth/components/admin/ProspectsActionBar";
import { ProspectsSkeleton } from "@/features/growth/components/admin/ProspectsSkeleton";
import { ProspectsToolbar } from "@/features/growth/components/admin/ProspectsToolbar";
import { SectionCards } from "@/features/growth/components/admin/SectionCards";
import { TodayCard } from "@/features/growth/components/admin/TodayCard";

import { formatBusinessName } from "@/features/growth/helpers/formatBusinessName";
import { leadFiltersQuery } from "@/features/growth/helpers/leadFiltersQuery";
import { FOLLOW_UP_LISTS, PROSPECT_VIEWS } from "@/features/growth/constants/leadPipeline";
import { ACTIVATION_STAGES } from "@/features/growth/constants/activation";
import { SWEEP_PATH, leadPath } from "@/features/growth/constants/routes";
import { startQueue } from "@/features/growth/services/leadQueue";
import { rememberLeadsList } from "@/features/growth/services/leadsReturn";

import type { FollowUpList, LeadView } from "@/features/growth/interfaces/lead";
import type { LeadQueueItem } from "@/features/growth/interfaces/leadQueue";
import type { SectionCardItem } from "@/features/growth/interfaces/prospects";

const compact = new Intl.NumberFormat("es-MX", { notation: "compact", maximumFractionDigits: 1 });

// The other sections download only when someone opens them; the map carries Leaflet.
const sectionLoading = () => <LoadingBlock message="Cargando sección…" variant="skeleton" />;
const ActivationView = dynamic(() => import("@/features/growth/components/admin/ActivationView").then((mod) => mod.ActivationView), { loading: sectionLoading });
const LeadsView = dynamic(() => import("@/features/growth/components/admin/LeadsView").then((mod) => mod.LeadsView), { loading: sectionLoading });
const MapView = dynamic(() => import("@/features/growth/components/admin/MapView").then((mod) => mod.MapView), { loading: sectionLoading, ssr: false });

/** Prospectos: «Tu día», the four sections as cards and the section's own work, with one main move per section. */
export function ProspectsView() {
  const { filters, search, setSearch, update, clear } = useProspectFilters();
  const { actor, isCoordinator } = useGrowthMe();
  const { team } = useGrowthTeam(isCoordinator);
  const { data: day, error: dayError } = useMyDay();
  const board = useLeadBoard({ municipio: filters.municipio, giro: filters.giro, owner: filters.owner, q: filters.q });
  const { data: activation, error: activationError } = useActivationBoard(filters.owner);
  const [adding, setAdding] = useState(false);
  const [helpOpen, setHelpOpen] = useGuideOnce();
  const people = (team?.members ?? []).filter((member) => member.user_id !== actor?.userId && member.status !== "suspended");
  const vista: LeadView = filters.vista ?? "seguimiento";
  const list: FollowUpList = filters.lista ?? "hoy";
  const query = leadFiltersQuery(filters);
  const showOwner = isCoordinator && filters.owner !== "me";

  useEffect(() => {
    if (vista === "seguimiento") rememberLeadsList(query);
  }, [vista, query]);

  const toActivate = ACTIVATION_STAGES.filter(({ stage }) => stage !== "activo").flatMap(({ stage }) => activation?.find((column) => column.stage === stage)?.leads ?? []);
  const due = board.data?.due ?? [];
  const counts = board.data?.counts;
  const sections: SectionCardItem[] = PROSPECT_VIEWS.map((view) => {
    if (view.value === "seguimiento") return { value: view.value, label: view.label, hint: "Para hoy", count: counts ? String(counts.due_today) : undefined, alert: Boolean(counts?.overdue) };
    if (view.value === "activacion") return { value: view.value, label: view.label, hint: "Por activar", count: activation ? String(toActivate.length) : undefined };
    if (view.value === "contactar") return { value: view.value, label: view.label, hint: "Sin contactar", count: day ? compact.format(day.first_messages_left) : undefined };
    return { value: view.value, label: view.label, hint: "Ubica negocios" };
  });

  const followUpLabel = FOLLOW_UP_LISTS.find((option) => option.value === list)?.label ?? "Para hoy";
  const asItems = (leads: Array<{ id: string; business_name: string }>) => leads.map((lead) => ({ id: lead.id, name: formatBusinessName(lead.business_name) }));
  // A link, not router.push, so the tap gets the same progress bar as everything else.
  const work = (label: string, text: string, items: LeadQueueItem[], className: string) =>
    items.length ? (
      <Link href={leadPath(items[0].id)} onClick={() => startQueue(label, items)} className={`${adminActionButtonPrimary} ${className}`}>
        <Play className="h-4 w-4" aria-hidden />{text}
      </Link>
    ) : (
      <button type="button" disabled className={`${adminActionButtonPrimary} ${className}`}><Play className="h-4 w-4" aria-hidden />{text}</button>
    );
  const primary = (className: string) => {
    if (vista === "seguimiento") return work("Para hoy", "Empezar con el más urgente", asItems(due), className);
    if (vista === "activacion") {
      return work("Por activar", "Revisar al siguiente", toActivate.map((lead) => ({ id: lead.lead_id, name: formatBusinessName(lead.business_name) })), className);
    }
    if (vista === "contactar") {
      return <Link href={SWEEP_PATH} className={`${adminActionButtonPrimary} ${className}`}><MessageCircle className="h-4 w-4" aria-hidden />Barrido de WhatsApp</Link>;
    }
    return null;
  };

  const ready = Boolean(board.data || board.error) && Boolean(activation || activationError) && Boolean(day || dayError);
  if (!ready) return <ProspectsSkeleton />;

  return (
    <div className="page-enter grid grid-cols-1 gap-4">
      <header className="flex items-center justify-between gap-2">
        <h1 className="text-2xl font-bold tracking-tight text-foreground">Prospectos</h1>
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-2 md:hidden">
            <button type="button" onClick={() => setHelpOpen(true)} aria-label="Ayuda" className={adminActionButtonIcon}><HelpCircle className="h-4.5 w-4.5" aria-hidden /></button>
            <button type="button" onClick={() => setAdding(true)} aria-label="Nuevo prospecto" className={adminActionButtonIcon}><Plus className="h-4.5 w-4.5" aria-hidden /></button>
          </div>
          <div className="hidden items-center gap-2 md:flex">
            <button type="button" onClick={() => setHelpOpen(true)} className={adminActionButtonText}><HelpCircle className="h-4 w-4" aria-hidden />Ayuda</button>
            <button type="button" onClick={() => setAdding(true)} className={adminActionButtonSecondary}><Plus className="h-4 w-4" aria-hidden />Nuevo prospecto</button>
            {primary("")}
          </div>
        </div>
      </header>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-[19.5rem_minmax(0,1fr)] lg:items-start">
        <aside className="min-w-0 lg:sticky lg:top-20">
          <TodayCard board={board.data} onList={(value) => update({ vista: "seguimiento", lista: value })} />
        </aside>

        <div className="grid min-w-0 gap-4">
          <SectionCards items={sections} active={vista} onSelect={(value) => update({ vista: value, stage: undefined, lista: undefined })} />
          <ProspectsToolbar filters={filters} search={search} onSearch={setSearch} onChange={update} onClear={clear} isCoordinator={isCoordinator} people={people} />

          {vista === "seguimiento" ? (
            <FollowUpView
              board={board.data}
              error={board.error}
              isLoading={board.isLoading}
              pending={board.isLoading && Boolean(board.data)}
              list={list}
              searching={Boolean(filters.q)}
              showOwner={showOwner}
              viewerId={actor?.userId ?? null}
              onList={(value) => update({ lista: value })}
              onOpen={(leads) => startQueue(followUpLabel, asItems(leads))}
            />
          ) : null}
          {vista === "activacion" ? <ActivationView owner={filters.owner} q={filters.q} showOwner={showOwner} /> : null}
          {vista === "contactar" ? <LeadsView /> : null}
          {vista === "mapa" ? <MapView giro={filters.giro} owner={filters.owner} people={team?.members ?? []} q={filters.q} /> : null}
        </div>
      </div>

      {vista !== "mapa" ? <ProspectsActionBar onAdd={() => setAdding(true)}>{primary("w-full")}</ProspectsActionBar> : null}
      <NewLeadSheet isOpen={adding} onClose={() => setAdding(false)} />
      <ProspectingGuide isOpen={helpOpen} onClose={() => setHelpOpen(false)} />
    </div>
  );
}
