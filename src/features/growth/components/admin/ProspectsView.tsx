"use client";

import { useEffect, useState } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { Plus } from "lucide-react";

import { useGrowthMe } from "@/features/growth/hooks/useGrowthMe";
import { useGrowthTeam } from "@/features/growth/hooks/useGrowthTeam";
import { FilterTabs } from "@/components/ui/FilterTabs";
import { FollowUpView } from "@/features/growth/components/admin/FollowUpView";
import { LeadsView } from "@/features/growth/components/admin/LeadsView";
import { MapView } from "@/features/growth/components/admin/MapView";
import { NewLeadSheet } from "@/features/growth/components/admin/NewLeadSheet";
import { ProspectingGuide } from "@/features/growth/components/admin/ProspectingGuide";
import { TodayPanel } from "@/features/growth/components/admin/TodayPanel";
import { pageHeaderCta } from "@/components/admin/actionButtonClasses";

import { leadFiltersQuery, parseLeadFilters } from "@/features/growth/helpers/leadFiltersQuery";
import { GIRO_COPY, GIRO_KEYS } from "@/features/growth/constants/giroCopy";
import { ZONES } from "@/features/growth/constants/zoneCopy";
import { rememberLeadsList } from "@/features/growth/services/leadsReturn";

import type { LeadFilters, LeadView } from "@/features/growth/interfaces/lead";

const VIEW_TABS = [
  { value: "seguimiento", label: "Seguimiento" },
  { value: "contactar", label: "Prospectar" },
  { value: "mapa", label: "Mapa" },
];

const selectClass = "input-form min-h-11 w-full min-w-0 rounded-xl border border-border bg-surface-raised px-3 text-sm text-foreground focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/20";

/** Prospectos = daily follow-up (board) + prospecting (list and sweep); zone and person filters are shared. */
export function ProspectsView() {
  const router = useRouter();
  const pathname = usePathname();
  const filters = parseLeadFilters(useSearchParams());
  const query = leadFiltersQuery(filters);
  const { actor, isCoordinator } = useGrowthMe();
  const { team } = useGrowthTeam(isCoordinator);
  const [adding, setAdding] = useState(false);
  const people = (team?.members ?? []).filter((member) => member.user_id !== actor?.userId && member.status !== "suspended");

  useEffect(() => {
    if (filters.vista === "seguimiento") rememberLeadsList(query);
  }, [filters.vista, query]);

  function navigate(next: LeadFilters) {
    const nextQuery = leadFiltersQuery(next);
    router.replace(nextQuery ? `${pathname}?${nextQuery}` : pathname, { scroll: false });
  }

  return (
    <div className="grid grid-cols-1 gap-4">
      {filters.vista === "seguimiento" ? <TodayPanel /> : null}
      <ProspectingGuide />
      <div className="grid grid-cols-1 gap-2 lg:grid-cols-[auto_minmax(0,1fr)_auto] lg:items-center">
        <FilterTabs
          tabs={VIEW_TABS}
          activeValue={filters.vista ?? "seguimiento"}
          onTabChange={(value) => navigate({ vista: value as LeadView, municipio: filters.municipio, giro: filters.giro, owner: filters.owner })}
          ariaLabel="Vista"
          density="touch"
        />
        {filters.vista !== "contactar" ? (
          <div className={`grid gap-2 lg:ml-auto ${isCoordinator ? "grid-cols-2 sm:grid-cols-3 lg:w-2xl" : "grid-cols-2 lg:w-md"}`}>
            {isCoordinator ? (
              <select
                aria-label="Persona"
                value={filters.owner ?? ""}
                onChange={(event) => navigate({ ...filters, owner: event.target.value || undefined })}
                className={`${selectClass} col-span-2 sm:col-span-1`}
              >
                <option value="">Todo el equipo</option>
                <option value="me">Mis prospectos</option>
                {people.map((member) => <option key={member.user_id} value={member.user_id}>{member.display_name}</option>)}
              </select>
            ) : null}
            <select aria-label="Municipio" value={filters.municipio ?? ""} onChange={(event) => navigate({ ...filters, municipio: event.target.value || undefined })} className={selectClass}>
              <option value="">Todos los municipios</option>
              {ZONES.map((zone) => <option key={zone.municipio} value={zone.municipio}>{zone.label}</option>)}
            </select>
            <select aria-label="Giro" value={filters.giro ?? ""} onChange={(event) => navigate({ ...filters, giro: event.target.value || undefined })} className={selectClass}>
              <option value="">Todos los giros</option>
              {GIRO_KEYS.map((key) => <option key={key} value={key}>{GIRO_COPY[key].label}</option>)}
            </select>
          </div>
        ) : <span className="hidden lg:block" />}
        <button type="button" onClick={() => setAdding(true)} className={`${pageHeaderCta} justify-center`}>
          <Plus className="h-4 w-4" aria-hidden />
          Nuevo prospecto
        </button>
      </div>
      {filters.vista === "seguimiento" ? <FollowUpView filters={filters} showOwner={isCoordinator && filters.owner !== "me"} /> : null}
      {filters.vista === "contactar" ? <LeadsView /> : null}
      {filters.vista === "mapa" ? <MapView giro={filters.giro} owner={filters.owner} people={team?.members ?? []} /> : null}
      <NewLeadSheet isOpen={adding} onClose={() => setAdding(false)} />
    </div>
  );
}
