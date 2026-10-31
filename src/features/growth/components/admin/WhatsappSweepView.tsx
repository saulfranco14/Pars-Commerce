"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { AlertTriangle, ArrowLeft, CheckCircle2, ChevronDown, PartyPopper, Send, SkipForward, XCircle } from "lucide-react";

import { useWhatsappSweep } from "@/features/growth/hooks/useWhatsappSweep";
import { EmptyState } from "@/components/admin/EmptyState";
import { PageHeader } from "@/components/admin/PageHeader";
import { adminActionButtonPrimary, adminActionButtonSecondary } from "@/components/admin/actionButtonClasses";
import { FilterTabs } from "@/components/ui/FilterTabs";
import { LoadingBlock } from "@/components/ui/LoadingBlock";
import { Notification } from "@/components/ui/Notification";
import { SweepCard } from "@/features/growth/components/admin/SweepCard";

import { formatBusinessName } from "@/features/growth/helpers/formatBusinessName";
import { GIRO_COPY, GIRO_KEYS, giroCopy } from "@/features/growth/constants/giroCopy";
import { SWEEP_KIND_TABS } from "@/features/growth/constants/sweep";
import { ZONES, zoneByMunicipio } from "@/features/growth/constants/zoneCopy";
import { backToLeads } from "@/features/growth/services/leadsReturn";
import { leadPath } from "@/features/growth/constants/routes";

import type { SweepKind } from "@/features/growth/interfaces/sweep";

const selectClass = "input-form min-h-11 w-full min-w-0 rounded-xl border border-border bg-surface-raised px-3 text-sm text-foreground focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/20";

export function WhatsappSweepView() {
  const router = useRouter();
  const sweep = useWhatsappSweep();
  const { filters, current, next, today, last } = sweep;
  const zone = [filters.municipio ? zoneByMunicipio(filters.municipio)?.label ?? filters.municipio : "Todos los municipios", filters.giro ? giroCopy(filters.giro).label : "todos los giros"].join(" · ");

  return (
    <div className="grid grid-cols-1 gap-4">
      <div className="grid gap-1 lg:flex lg:items-center lg:gap-4">
        <button type="button" onClick={() => backToLeads(router)} className="-ml-1 inline-flex min-h-11 w-fit items-center gap-2 px-1 text-sm font-semibold text-muted-foreground hover:text-foreground">
          <ArrowLeft className="h-4 w-4" aria-hidden />Prospectos
        </button>
        <PageHeader title="Barrido de WhatsApp" />
      </div>

      <section className="grid grid-cols-1 gap-2 rounded-2xl border border-border bg-surface p-3 sm:p-4 lg:grid-cols-[auto_minmax(0,1fr)_auto] lg:items-center lg:gap-4 lg:py-2">
        <FilterTabs
          tabs={SWEEP_KIND_TABS}
          activeValue={filters.kind}
          onTabChange={(value) => sweep.changeFilters({ kind: value as SweepKind })}
          ariaLabel="Qué mensaje mandar"
          density="touch"
        />
        <details className="group">
          <summary className="flex min-h-11 cursor-pointer list-none items-center justify-between gap-2 rounded-lg px-1 text-sm text-muted-foreground hover:text-foreground">
            <span className="truncate"><span className="font-semibold text-foreground">{zone}</span></span>
            <span className="inline-flex shrink-0 items-center gap-1 font-semibold text-accent">Cambiar<ChevronDown className="h-4 w-4 transition-transform group-open:rotate-180" aria-hidden /></span>
          </summary>
          <div className="grid grid-cols-2 gap-2 pt-2 lg:min-w-md">
            <select aria-label="Municipio" value={filters.municipio ?? ""} onChange={(event) => sweep.changeFilters({ municipio: event.target.value || undefined })} className={selectClass}>
              <option value="">Todos los municipios</option>
              {ZONES.map((item) => <option key={item.municipio} value={item.municipio}>{item.label}</option>)}
            </select>
            <select aria-label="Giro" value={filters.giro ?? ""} onChange={(event) => sweep.changeFilters({ giro: event.target.value || undefined })} className={selectClass}>
              <option value="">Todos los giros</option>
              {GIRO_KEYS.map((key) => <option key={key} value={key}>{GIRO_COPY[key].label}</option>)}
            </select>
          </div>
        </details>
        <ul className="flex flex-wrap items-center gap-x-4 gap-y-1 border-t border-border-soft pt-2 text-sm tabular-nums text-muted-foreground lg:border-0 lg:pt-0" aria-label="Avance de hoy">
          <li className="inline-flex items-center gap-1.5"><Send className="h-4 w-4 text-emerald-600" aria-hidden /><b className="text-foreground">{today.sent}</b> enviados hoy</li>
          <li className="inline-flex items-center gap-1.5"><XCircle className="h-4 w-4 text-red-600" aria-hidden /><b className="text-foreground">{today.noWhatsapp + today.wrongNumber}</b> sin WhatsApp</li>
          <li className="inline-flex items-center gap-1.5"><SkipForward className="h-4 w-4 text-amber-600" aria-hidden /><b className="text-foreground">{sweep.skipped}</b> saltados</li>
          <li className="ml-auto font-semibold text-accent">Quedan {sweep.remaining === null ? "…" : sweep.remaining.toLocaleString("es-MX")}</li>
        </ul>
      </section>

      {sweep.actionError ? <Notification tone="error" message={sweep.actionError} onDismiss={sweep.clearActionError} /> : null}
      {last ? (
        <p className="inline-flex min-w-0 items-center gap-2 text-sm text-muted-foreground">
          <CheckCircle2 className="h-4 w-4 shrink-0 text-emerald-600" aria-hidden />
          <span className="truncate">
            {last.label}: <Link href={leadPath(last.lead.id)} className="font-semibold text-foreground hover:underline">{formatBusinessName(last.lead.business_name)}</Link>
          </span>
        </p>
      ) : null}

      {sweep.loading && !current ? (
        <LoadingBlock message="Apartando los siguientes negocios…" variant="skeleton" />
      ) : sweep.error && !current ? (
        <EmptyState
          icon={AlertTriangle}
          title="No pudimos traer los siguientes negocios"
          description={sweep.error}
          action={<button type="button" onClick={() => void sweep.retry()} className={adminActionButtonPrimary}>Reintentar</button>}
          tone="muted"
        />
      ) : current ? (
        <SweepCard key={`${current.id}-${current.phone_e164}`} lead={current} next={next} onOutcome={sweep.mark} onSkip={sweep.skip} onPhoneChanged={sweep.replaceCurrent} />
      ) : (
        <EmptyState
          icon={PartyPopper}
          title="Terminaste este barrido"
          description={
            filters.kind === "whatsapp"
              ? "No quedan negocios sin primer mensaje con estos filtros. Cambia de municipio o de giro, o revisa los seguimientos."
              : "No hay seguimientos pendientes con estos filtros: a los demás les escribiste hace menos de 3 días."
          }
          action={
            <button type="button" onClick={() => sweep.changeFilters({ kind: filters.kind === "whatsapp" ? "seguimiento" : "whatsapp" })} className={adminActionButtonSecondary}>
              {filters.kind === "whatsapp" ? "Ver seguimientos" : "Ver primeros mensajes"}
            </button>
          }
          tone="accent"
        />
      )}

      {current && next ? (
        <p className="truncate text-sm text-muted-foreground lg:hidden">
          Sigue: <span className="font-semibold text-foreground">{formatBusinessName(next.business_name)}</span>{next.colonia ? ` · ${formatBusinessName(next.colonia)}` : ""}
        </p>
      ) : null}
    </div>
  );
}
