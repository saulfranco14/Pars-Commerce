"use client";

import { useEffect, useState } from "react";
import { HelpCircle, Plus } from "lucide-react";

import { useGrowthMe } from "@/features/growth/hooks/useGrowthMe";
import { useGrowthTeam } from "@/features/growth/hooks/useGrowthTeam";
import { useGuideOnce } from "@/features/growth/hooks/useGuideOnce";
import { useProspectFilters } from "@/features/growth/hooks/useProspectFilters";
import { PageHeader } from "@/components/admin/PageHeader";
import { adminActionButtonPrimary, adminActionButtonText } from "@/components/admin/actionButtonClasses";
import { FilterTabs } from "@/components/ui/FilterTabs";
import { ActivationView } from "@/features/growth/components/admin/ActivationView";
import { FollowUpView } from "@/features/growth/components/admin/FollowUpView";
import { LeadsView } from "@/features/growth/components/admin/LeadsView";
import { MapView } from "@/features/growth/components/admin/MapView";
import { NewLeadSheet } from "@/features/growth/components/admin/NewLeadSheet";
import { ProspectingGuide } from "@/features/growth/components/admin/ProspectingGuide";
import { ProspectsToolbar } from "@/features/growth/components/admin/ProspectsToolbar";
import { TodayStrip } from "@/features/growth/components/admin/TodayStrip";

import { leadFiltersQuery } from "@/features/growth/helpers/leadFiltersQuery";
import { PROSPECT_VIEWS } from "@/features/growth/constants/leadPipeline";
import { rememberLeadsList } from "@/features/growth/services/leadsReturn";

import type { LeadView } from "@/features/growth/interfaces/lead";

/** Prospectos: the same header on every tab (Tu día, tabs, search and filters), then the tab's own work. */
export function ProspectsView() {
  const { filters, search, setSearch, update, clear } = useProspectFilters();
  const { actor, isCoordinator } = useGrowthMe();
  const { team } = useGrowthTeam(isCoordinator);
  const [adding, setAdding] = useState(false);
  const [helpOpen, setHelpOpen] = useGuideOnce();
  const people = (team?.members ?? []).filter((member) => member.user_id !== actor?.userId && member.status !== "suspended");
  const view = PROSPECT_VIEWS.find((item) => item.value === (filters.vista ?? "seguimiento")) ?? PROSPECT_VIEWS[0];
  const query = leadFiltersQuery(filters);

  useEffect(() => {
    if (filters.vista === "seguimiento") rememberLeadsList(query);
  }, [filters.vista, query]);

  return (
    <div className="grid grid-cols-1 gap-4">
      <PageHeader
        eyebrow="Prospección"
        title="Prospectos"
        action={
          <div className="flex items-center gap-1">
            <button type="button" onClick={() => setHelpOpen(true)} className={adminActionButtonText}>
              <HelpCircle className="h-4 w-4" aria-hidden />Ayuda
            </button>
            <button type="button" onClick={() => setAdding(true)} className={adminActionButtonPrimary}>
              <Plus className="h-4 w-4" aria-hidden />Nuevo<span className="hidden sm:inline"> prospecto</span>
            </button>
          </div>
        }
      />

      <TodayStrip />

      <div className="grid gap-1.5">
        <FilterTabs tabs={PROSPECT_VIEWS} activeValue={view.value} onTabChange={(value) => update({ vista: value as LeadView, stage: undefined })} ariaLabel="Pestañas" density="touch" />
        <p className="text-sm text-muted-foreground">{view.hint}</p>
      </div>

      <ProspectsToolbar filters={filters} search={search} onSearch={setSearch} onChange={update} onClear={clear} isCoordinator={isCoordinator} people={people} />

      {filters.vista === "seguimiento" ? <FollowUpView filters={filters} showOwner={isCoordinator && filters.owner !== "me"} /> : null}
      {filters.vista === "activacion" ? <ActivationView owner={filters.owner} q={filters.q} showOwner={isCoordinator && filters.owner !== "me"} /> : null}
      {filters.vista === "contactar" ? <LeadsView /> : null}
      {filters.vista === "mapa" ? <MapView giro={filters.giro} owner={filters.owner} people={team?.members ?? []} q={filters.q} /> : null}

      <NewLeadSheet isOpen={adding} onClose={() => setAdding(false)} />
      <ProspectingGuide isOpen={helpOpen} onClose={() => setHelpOpen(false)} />
    </div>
  );
}
