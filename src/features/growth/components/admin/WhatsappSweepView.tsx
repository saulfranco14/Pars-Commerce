"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { AlertTriangle, ArrowLeft, CheckCircle2, ChevronDown, PartyPopper, PhoneOff, XCircle } from "lucide-react";

import { useMyDay } from "@/features/growth/hooks/useMyDay";
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
  const { filters, current, next, today, last, lastSent } = sweep;
  const { data: day } = useMyDay();
  const goal = Math.max(day?.daily_goal ?? 20, 1);
  const progress = Math.min(100, Math.round((today.sent / goal) * 100));
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
        <div className="grid gap-1.5 border-t border-border-soft pt-2 lg:min-w-64 lg:border-0 lg:pt-0" aria-label="Avance de hoy">
          <p className="flex items-center justify-between gap-2 text-sm tabular-nums text-muted-foreground">
            <span><b className="text-foreground">{today.sent} de {goal}</b> hoy{today.sent >= goal ? " · meta cumplida" : ""}</span>
            <span>Quedan {sweep.remaining === null ? "…" : sweep.remaining.toLocaleString("es-MX")}</span>
          </p>
          <div className="h-2 overflow-hidden rounded-full bg-border-soft" role="progressbar" aria-valuenow={today.sent} aria-valuemax={goal} aria-label="Meta del día">
            <div className={`h-full rounded-full ${today.sent >= goal ? "bg-emerald-600" : "bg-accent"}`} style={{ width: `${progress}%` }} />
          </div>
        </div>
      </section>

      {sweep.actionError ? <Notification tone="error" message={sweep.actionError} onDismiss={sweep.clearActionError} /> : null}
      {lastSent ? (
        <Notification
          tone="success"
          onDismiss={sweep.dismissLastSent}
          message={
            <span className="flex flex-wrap items-center gap-x-3 gap-y-1">
              <span>Enviado a <Link href={leadPath(lastSent.leadId)} className="font-semibold underline-offset-2 hover:underline">{lastSent.name}</Link>. ¿No se envió?</span>
              <span className="flex flex-wrap gap-1">
                <button type="button" onClick={() => void sweep.correctLast("no_whatsapp")} className="inline-flex min-h-9 items-center gap-1 rounded-lg px-2 font-semibold hover:bg-emerald-100"><PhoneOff className="h-4 w-4" aria-hidden />No tiene WhatsApp</button>
                <button type="button" onClick={() => void sweep.correctLast("wrong_number")} className="inline-flex min-h-9 items-center gap-1 rounded-lg px-2 font-semibold hover:bg-emerald-100"><XCircle className="h-4 w-4" aria-hidden />Número equivocado</button>
              </span>
            </span>
          }
        />
      ) : last ? (
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
        <SweepCard key={`${current.id}-${current.phone_e164}`} lead={current} next={next} onSend={sweep.send} onSkip={sweep.skip} onPhoneChanged={sweep.replaceCurrent} />
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

    </div>
  );
}
