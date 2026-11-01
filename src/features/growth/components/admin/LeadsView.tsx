"use client";

import Link from "next/link";
import { AlertTriangle, Mail, MessageCircle, Send, Target } from "lucide-react";

import { useGrowthLeads } from "@/features/growth/hooks/useGrowthLeads";
import { AdminListCard } from "@/components/admin/AdminListCard";
import { EmptyState } from "@/components/admin/EmptyState";
import { StatusBadge } from "@/components/admin/StatusBadge";
import { adminActionButtonPrimary } from "@/components/admin/actionButtonClasses";
import { FilterTabs } from "@/components/ui/FilterTabs";
import { LoadingBlock } from "@/components/ui/LoadingBlock";
import { PlatformPagination } from "@/features/platform/components/PlatformPagination";
import { PipelineDots } from "@/features/growth/components/admin/PipelineDots";

import { formatBusinessName } from "@/features/growth/helpers/formatBusinessName";
import { leadLastTouch } from "@/features/growth/helpers/leadLastTouch";
import { nextStepDue } from "@/features/growth/helpers/leadPipeline";
import { sweepFiltersQuery } from "@/features/growth/helpers/sweepFilters";
import { giroCopy } from "@/features/growth/constants/giroCopy";
import { LEAD_STAGE_META, LEAD_STAGE_TABS, NEXT_CHANNEL_LABEL } from "@/features/growth/constants/leadStages";
import { SWEEP_PATH, leadPath } from "@/features/growth/constants/routes";
import { zoneByMunicipio } from "@/features/growth/constants/zoneCopy";
import { markOpenedFromList } from "@/features/growth/services/leadsReturn";
import { formatMexicanPhoneInput } from "@/lib/phone";

import type { LeadStageFilter } from "@/features/growth/interfaces/lead";

export function LeadsView() {
  const { data, error, isLoading, filters, update, active } = useGrowthLeads();

  if (isLoading && !data) return <LoadingBlock message="Cargando prospectos…" variant="skeleton" />;
  if (error && !data) {
    return <EmptyState icon={AlertTriangle} title="No pudimos cargar los prospectos" description="Revisa que la migración de growth esté aplicada e intenta de nuevo." tone="muted" />;
  }

  const metrics = data?.metrics ?? { total: 0, contacted: 0, conversing: 0, registered: 0, withPhone: 0, withEmail: 0 };
  const leads = data?.leads ?? [];
  const totalPages = Math.max(1, Math.ceil((data?.total ?? 0) / (data?.pageSize ?? 30)));
  const now = new Date();
  const zoneLabel = filters.municipio ? zoneByMunicipio(filters.municipio)?.label ?? filters.municipio : null;
  const sweepQuery = sweepFiltersQuery({ kind: "whatsapp", municipio: filters.municipio, giro: filters.giro });

  return (
    <div className="grid grid-cols-1 gap-5">
      <section className="flex items-center justify-between gap-3 rounded-2xl border border-accent/30 bg-accent/5 p-3 sm:p-4">
        <div className="min-w-0">
          <p className="text-base font-bold text-foreground">Barrido de WhatsApp</p>
          <p className="hidden text-sm text-muted-foreground sm:block">
            Los negocios uno por uno{zoneLabel ? ` en ${zoneLabel}` : ""}{filters.giro ? ` · ${giroCopy(filters.giro).label}` : ""}, con el mensaje listo y sin perder dónde vas.
          </p>
        </div>
        <Link href={sweepQuery ? `${SWEEP_PATH}?${sweepQuery}` : SWEEP_PATH} onClick={markOpenedFromList} className={`${adminActionButtonPrimary} shrink-0`}>
          <Send className="h-4 w-4" aria-hidden />Empezar
        </Link>
      </section>

      <FilterTabs
        tabs={LEAD_STAGE_TABS}
        activeValue={filters.stage ?? "activos"}
        onTabChange={(value) => update({ stage: value as LeadStageFilter })}
        ariaLabel="Filtrar por etapa"
      />

      <section className="min-w-0 overflow-hidden rounded-2xl border border-border bg-surface">
        <div className="flex min-h-11 flex-wrap items-center justify-between gap-2 border-b border-border-soft px-3 sm:px-4">
          <p className="text-sm text-muted-foreground">
            {(data?.total ?? 0).toLocaleString("es-MX")} {data?.total === 1 ? "prospecto" : "prospectos"}{active ? " con estos filtros" : ""}
            {metrics.withPhone ? ` · ${metrics.withPhone.toLocaleString("es-MX")} con WhatsApp` : ""}
          </p>
        </div>

        {leads.length === 0 ? (
          <div className="p-4">
            <EmptyState icon={Target} title="Sin prospectos en este filtro" description="Cambia el filtro o carga el DENUE con el script de importación." tone="muted" />
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-2 p-3 sm:p-4 xl:grid-cols-2">
            {leads.map((lead) => {
              const touch = leadLastTouch(lead, now);
              const due = nextStepDue(lead, now);
              const place = [lead.colonia ? formatBusinessName(lead.colonia) : null, zoneByMunicipio(lead.municipio)?.label ?? lead.municipio].filter(Boolean).join(", ");
              return (
                <Link key={lead.id} href={leadPath(lead.id)} onClick={markOpenedFromList} className="block min-w-0 rounded-2xl focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent">
                  <AdminListCard
                    compact
                    title={formatBusinessName(lead.business_name)}
                    badge={<StatusBadge tone={LEAD_STAGE_META[lead.stage].tone} label={LEAD_STAGE_META[lead.stage].label} compact />}
                    meta={<span className="block truncate">{giroCopy(lead.giro).label} · {place} · Siguiente: {NEXT_CHANNEL_LABEL[lead.next_channel]}</span>}
                    body={
                      <span className="flex min-w-0 flex-wrap items-center gap-x-3 gap-y-1 text-xs">
                          <PipelineDots stage={lead.stage} />
                          {lead.phone_e164 ? <span className="inline-flex items-center gap-1 tabular-nums text-emerald-700"><MessageCircle className="h-3.5 w-3.5" aria-hidden />{formatMexicanPhoneInput(lead.phone_e164)}</span> : null}
                          {lead.email ? <span className="inline-flex min-w-0 max-w-full items-center gap-1 text-accent"><Mail className="h-3.5 w-3.5 shrink-0" aria-hidden /><span className="truncate">{lead.email}</span></span> : null}
                          {touch ? <StatusBadge tone={touch.tone} label={touch.label} compact dot={false} /> : null}
                          {due ? <StatusBadge tone={due.tone} label={`${due.label} · ${due.when}`} compact dot={false} /> : null}
                      </span>
                    }
                  />
                </Link>
              );
            })}
          </div>
        )}
        <PlatformPagination page={filters.page ?? 1} totalPages={totalPages} total={data?.total ?? 0} itemLabel="prospectos" onChange={(page) => update({ page })} />
      </section>
    </div>
  );
}
