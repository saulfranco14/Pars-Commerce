"use client";

import { useEffect } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";

import { FilterTabs } from "@/components/ui/FilterTabs";
import { FollowUpView } from "@/features/growth/components/admin/FollowUpView";
import { LeadsView } from "@/features/growth/components/admin/LeadsView";

import { leadFiltersQuery, parseLeadFilters } from "@/features/growth/helpers/leadFiltersQuery";
import { GIRO_COPY, GIRO_KEYS } from "@/features/growth/constants/giroCopy";
import { ZONES } from "@/features/growth/constants/zoneCopy";
import { rememberLeadsList } from "@/features/growth/services/leadsReturn";

import type { LeadFilters, LeadView } from "@/features/growth/interfaces/lead";

const VIEW_TABS = [
  { value: "seguimiento", label: "Seguimiento" },
  { value: "contactar", label: "Prospectar" },
];

const selectClass = "input-form min-h-11 w-full min-w-0 rounded-xl border border-border bg-surface-raised px-3 text-sm text-foreground focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/20";

/** Prospectos = daily follow-up (board) + prospecting (list and sweep); the zone filter is shared. */
export function ProspectsView() {
  const router = useRouter();
  const pathname = usePathname();
  const filters = parseLeadFilters(useSearchParams());
  const query = leadFiltersQuery(filters);

  useEffect(() => {
    if (filters.vista === "seguimiento") rememberLeadsList(query);
  }, [filters.vista, query]);

  function navigate(next: LeadFilters) {
    const nextQuery = leadFiltersQuery(next);
    router.replace(nextQuery ? `${pathname}?${nextQuery}` : pathname, { scroll: false });
  }

  return (
    <div className="grid grid-cols-1 gap-4">
      <div className="grid grid-cols-1 gap-2 lg:grid-cols-[auto_minmax(0,1fr)] lg:items-center">
        <FilterTabs
          tabs={VIEW_TABS}
          activeValue={filters.vista ?? "seguimiento"}
          onTabChange={(value) => navigate({ vista: value as LeadView, municipio: filters.municipio, giro: filters.giro })}
          ariaLabel="Vista"
          density="touch"
        />
        {filters.vista === "seguimiento" ? (
          <div className="grid grid-cols-2 gap-2 lg:ml-auto lg:w-md">
            <select aria-label="Municipio" value={filters.municipio ?? ""} onChange={(event) => navigate({ ...filters, municipio: event.target.value || undefined })} className={selectClass}>
              <option value="">Todos los municipios</option>
              {ZONES.map((zone) => <option key={zone.municipio} value={zone.municipio}>{zone.label}</option>)}
            </select>
            <select aria-label="Giro" value={filters.giro ?? ""} onChange={(event) => navigate({ ...filters, giro: event.target.value || undefined })} className={selectClass}>
              <option value="">Todos los giros</option>
              {GIRO_KEYS.map((key) => <option key={key} value={key}>{GIRO_COPY[key].label}</option>)}
            </select>
          </div>
        ) : null}
      </div>
      {filters.vista === "seguimiento" ? <FollowUpView filters={filters} /> : <LeadsView />}
    </div>
  );
}
