"use client";

import Link from "next/link";
import { AlertTriangle, Mail, MapPin, MessageCircle, Search, Target } from "lucide-react";

import { useGrowthLeads } from "@/features/growth/hooks/useGrowthLeads";
import { AdminListCard } from "@/components/admin/AdminListCard";
import { EmptyState } from "@/components/admin/EmptyState";
import { MetricsStrip } from "@/components/admin/MetricsStrip";
import { StatusBadge } from "@/components/admin/StatusBadge";
import { FilterTabs } from "@/components/ui/FilterTabs";
import { LoadingBlock } from "@/components/ui/LoadingBlock";
import { PlatformPagination } from "@/features/platform/components/PlatformPagination";

import { GIRO_COPY, GIRO_KEYS, giroCopy } from "@/features/growth/constants/giroCopy";
import { LEAD_STAGE_META, LEAD_STAGE_TABS, NEXT_CHANNEL_LABEL } from "@/features/growth/constants/leadStages";
import { ZONES, zoneByMunicipio } from "@/features/growth/constants/zoneCopy";
import { formatMexicanPhoneInput } from "@/lib/phone";

import type { LeadContactFilter, LeadStageFilter } from "@/features/growth/interfaces/lead";

const selectClass = "input-form min-h-11 rounded-xl border border-border bg-surface-raised px-3 text-sm text-foreground focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/20";

export function LeadsView() {
  const { data, error, isLoading, filters, update, search, changeSearch } = useGrowthLeads();

  if (isLoading && !data) return <LoadingBlock message="Cargando prospectos…" variant="skeleton" />;
  if (error && !data) {
    return <EmptyState icon={AlertTriangle} title="No pudimos cargar los prospectos" description="Revisa que la migración de growth esté aplicada e intenta de nuevo." tone="muted" />;
  }

  const metrics = data?.metrics ?? { total: 0, contacted: 0, conversing: 0, registered: 0, withPhone: 0, withEmail: 0 };
  const leads = data?.leads ?? [];
  const totalPages = Math.max(1, Math.ceil((data?.total ?? 0) / (data?.pageSize ?? 30)));

  return (
    <div className="grid gap-5">
      <MetricsStrip
        metrics={[
          { label: "Prospectos", value: metrics.total.toLocaleString("es-MX") },
          { label: "Contactados", value: metrics.contacted.toLocaleString("es-MX"), tone: "accent" },
          { label: "Conversando", value: metrics.conversing.toLocaleString("es-MX"), tone: "amber" },
          { label: "Registrados", value: metrics.registered.toLocaleString("es-MX"), tone: "emerald" },
        ]}
      />

      <FilterTabs
        tabs={LEAD_STAGE_TABS}
        activeValue={filters.stage ?? "todos"}
        onTabChange={(value) => update({ stage: value as LeadStageFilter })}
        ariaLabel="Filtrar por etapa"
      />

      <section className="overflow-hidden rounded-2xl border border-border bg-surface">
        <div className="grid gap-2 border-b border-border-soft p-3 sm:grid-cols-[1fr_auto_auto_auto] sm:p-4">
          <label className="relative block">
            <span className="sr-only">Buscar prospecto</span>
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" aria-hidden />
            <input
              type="search"
              value={search}
              onChange={(event) => changeSearch(event.target.value)}
              placeholder="Buscar por nombre del negocio"
              className="input-form min-h-11 w-full rounded-xl border border-border bg-surface-raised pl-10 pr-3 text-sm text-foreground outline-none transition focus:border-accent focus:ring-2 focus:ring-accent/20"
            />
          </label>
          <select aria-label="Municipio" value={filters.municipio ?? ""} onChange={(event) => update({ municipio: event.target.value || undefined })} className={selectClass}>
            <option value="">Todos los municipios</option>
            {ZONES.map((zone) => <option key={zone.municipio} value={zone.municipio}>{zone.label}</option>)}
          </select>
          <select aria-label="Giro" value={filters.giro ?? ""} onChange={(event) => update({ giro: event.target.value || undefined })} className={selectClass}>
            <option value="">Todos los giros</option>
            {GIRO_KEYS.map((key) => <option key={key} value={key}>{GIRO_COPY[key].label}</option>)}
          </select>
          <select aria-label="Contacto" value={filters.contact ?? ""} onChange={(event) => update({ contact: (event.target.value || undefined) as LeadContactFilter | undefined })} className={selectClass}>
            <option value="">Cualquier contacto</option>
            <option value="whatsapp">Con WhatsApp ({metrics.withPhone.toLocaleString("es-MX")})</option>
            <option value="correo">Con correo ({metrics.withEmail.toLocaleString("es-MX")})</option>
            <option value="ambos">Con WhatsApp y correo</option>
            <option value="sin">Sin teléfono ni correo (visita)</option>
          </select>
        </div>

        {leads.length === 0 ? (
          <div className="p-4">
            <EmptyState icon={Target} title="Sin prospectos en este filtro" description="Cambia el filtro o carga el DENUE con el script de importación." tone="muted" />
          </div>
        ) : (
          <div className="grid gap-2 p-3 sm:p-4">
            {leads.map((lead) => (
              <Link key={lead.id} href={`/dashboard/plataforma/prospectos/${lead.id}`} className="block rounded-2xl focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent">
                <AdminListCard
                  title={lead.business_name}
                  badge={<StatusBadge tone={LEAD_STAGE_META[lead.stage].tone} label={LEAD_STAGE_META[lead.stage].label} compact />}
                  meta={
                    <span className="inline-flex flex-wrap items-center gap-x-2 gap-y-1">
                      <span>{giroCopy(lead.giro).label}</span>
                      <span className="inline-flex items-center gap-1"><MapPin className="h-3.5 w-3.5" aria-hidden />{[lead.colonia, zoneByMunicipio(lead.municipio)?.label ?? lead.municipio].filter(Boolean).join(", ")}</span>
                      <span>Siguiente: {NEXT_CHANNEL_LABEL[lead.next_channel]}</span>
                      {lead.phone_e164 ? <span className="inline-flex items-center gap-1 text-emerald-700"><MessageCircle className="h-3.5 w-3.5" aria-hidden />{formatMexicanPhoneInput(lead.phone_e164)}</span> : null}
                      {lead.email ? <span className="inline-flex items-center gap-1 text-accent"><Mail className="h-3.5 w-3.5" aria-hidden />{lead.email}</span> : null}
                    </span>
                  }
                />
              </Link>
            ))}
          </div>
        )}
        <PlatformPagination page={filters.page ?? 1} totalPages={totalPages} total={data?.total ?? 0} itemLabel="prospectos" onChange={(page) => update({ page })} />
      </section>
    </div>
  );
}
