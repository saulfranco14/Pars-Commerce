"use client";

import { useSearchParams } from "next/navigation";
import { useState } from "react";
import useSWR, { mutate } from "swr";
import {
  AlertTriangle,
  CheckCircle2,
  Landmark,
  ListChecks,
  ShieldCheck,
  TrendingUp,
  Store,
} from "lucide-react";

import { EmptyState } from "@/components/admin/EmptyState";
import { MetricsStrip } from "@/components/admin/MetricsStrip";
import { PageHeader } from "@/components/admin/PageHeader";
import { StatusBadge } from "@/components/admin/StatusBadge";
import { LoadingBlock } from "@/components/ui/LoadingBlock";
import { PlatformBusinessesView } from "@/features/platform/components/PlatformBusinessesView";
import { DEMO_PORTFOLIO } from "@/features/catalog/demoPortfolio";
import { PlatformUsersView } from "@/features/platform/components/PlatformUsersView";
import { STATUS_LABEL, STATUS_TONE } from "@/features/settlement/constants/labels";
import { formatMXN } from "@/lib/loanUtils";
import { swrFetcher } from "@/lib/swrFetcher";
import { useTenantStore } from "@/stores/useTenantStore";
import type { SettlementStatus } from "@/types/settlement";
import type { PlatformDashboard } from "@/types/settlementDashboard";

type PlatformView = "operation" | "users" | "businesses" | "audit";
type PlatformEvent = {
  id: string;
  action: string;
  entity_type: string;
  entity_id: string | null;
  created_at: string;
};

const VIEW_COPY: Record<PlatformView, { title: string; description: string }> = {
  operation: {
    title: "Operación",
    description: "Supervisa liquidaciones, actividad de pedidos y alertas de todos los negocios.",
  },
  users: {
    title: "Usuarios",
    description: "Localiza cuentas, revisa su contexto y administra su acceso a la plataforma.",
  },
  businesses: {
    title: "Negocios",
    description: "Entiende la operación, el responsable y los límites de acceso de cada comercio.",
  },
  audit: {
    title: "Auditoría",
    description: "Revisa la trazabilidad de los cambios realizados dentro de la plataforma.",
  },
};

export default function PlataformaPage() {
  const searchParams = useSearchParams();
  const requestedView = searchParams.get("view");
  const view: PlatformView =
    requestedView === "users" || requestedView === "businesses" || requestedView === "audit"
      ? requestedView
      : "operation";
  const copy = VIEW_COPY[view];

  return (
    <div className="mx-auto max-w-[1440px] space-y-5">
      <PageHeader eyebrow="Plataforma" title={copy.title} description={copy.description} />
      {view === "operation" && <OperationModule />}
      {view === "users" && <PlatformUsersView />}
      {view === "businesses" && <PlatformBusinessesView />}
      {view === "audit" && <AuditModule />}
    </div>
  );
}

function OperationModule() {
  const [demoLoading, setDemoLoading] = useState(false);
  const [demoMessage, setDemoMessage] = useState<string | null>(null);
  const [preparedDemoCount, setPreparedDemoCount] = useState<number | null>(null);
  const memberships = useTenantStore((state) => state.memberships);
  const portfolioCount = Math.max(
    preparedDemoCount ?? 0,
    memberships.filter((membership) => membership.tenant.is_demo).length,
  );
  const demosReady = portfolioCount >= DEMO_PORTFOLIO.length;
  const {
    data: treasury,
    error: treasuryError,
    isLoading: treasuryLoading,
  } = useSWR<PlatformDashboard>("/api/settlement-dashboard", swrFetcher);
  const {
    data: health,
    error: healthError,
    isLoading: healthLoading,
  } = useSWR<{
    open_orders: number;
    stale_tables: Array<{ id: string }>;
    errors_last_24h: number;
  }>("/api/platform/operation-health", swrFetcher);

  if (treasuryLoading) return <LoadingBlock message="Cargando operación…" variant="skeleton" />;
  if (treasuryError || !treasury) {
    return (
      <EmptyState
        icon={AlertTriangle}
        title="Sin acceso"
        description="Esta sección es solo para administradores de la plataforma."
      />
    );
  }

  return (
    <>
      <section className="flex flex-col gap-3 rounded-2xl border border-border bg-surface p-4 shadow-sm sm:flex-row sm:items-center sm:justify-between">
        <div><h2 className="text-sm font-bold text-foreground">Portafolio de demos</h2><p className="mt-1 text-sm text-muted-foreground">{demosReady ? `Tus ${portfolioCount} demos están listas. Cámbialas desde el selector de negocios, en la sección “Mis demos”.` : "Prepara o repara las tiendas demo de forma idempotente. Es un privilegio de super admin y no habilita cobros ni pedidos reales."}</p></div>
        {demosReady ? (
          <span className="inline-flex min-h-11 shrink-0 items-center justify-center gap-2 rounded-xl bg-emerald-50 px-4 py-2 text-sm font-bold text-emerald-800"><CheckCircle2 className="h-4 w-4" aria-hidden />Demos listas</span>
        ) : (
          <button type="button" onClick={async () => { setDemoLoading(true); setDemoMessage(null); try { const response = await fetch("/api/platform/demo-portfolio", { method: "POST", headers: { "Content-Type": "application/json" }, body: "{}" }); const result = await response.json(); if (!response.ok) throw new Error(result.error ?? "No pudimos preparar las demos."); setPreparedDemoCount(result.count); await mutate("/api/tenants"); setDemoMessage(`${result.count} demos listas en tu selector de negocios.`); } catch (error) { setDemoMessage(error instanceof Error ? error.message : "No pudimos preparar las demos."); } finally { setDemoLoading(false); } }} disabled={demoLoading} className="inline-flex min-h-11 shrink-0 items-center justify-center gap-2 rounded-xl bg-accent px-4 py-2 text-sm font-bold text-accent-foreground transition-colors hover:bg-accent-hover disabled:opacity-50"><Store className="h-4 w-4" aria-hidden />{demoLoading ? "Preparando…" : "Preparar demos"}</button>
        )}
        {demoMessage && !demosReady && <p role="status" className="text-sm text-muted-foreground">{demoMessage}</p>}
      </section>
      <MetricsStrip
        metrics={[
          { label: "Por liquidar (total)", value: formatMXN(treasury.total_outstanding), tone: "amber", icon: Landmark },
          { label: "Comisión cobrada", value: formatMXN(treasury.commission_confirmed), tone: "emerald", icon: TrendingUp },
          { label: "Requieren acción", value: treasury.needs_action, tone: treasury.needs_action > 0 ? "accent" : "default", icon: ListChecks },
          { label: "En revisión", value: treasury.disputed, tone: treasury.disputed > 0 ? "red" : "default", icon: AlertTriangle },
        ]}
      />

      {healthLoading ? (
        <LoadingBlock message="Cargando estado operativo…" variant="skeleton" skeletonRows={3} />
      ) : healthError ? (
        <InlineError message="No se pudo cargar el estado operativo." />
      ) : (
        <section className="grid gap-3 sm:grid-cols-3" aria-label="Estado operativo">
          <OperationalMetric label="Órdenes abiertas" value={health?.open_orders ?? 0} />
          <OperationalMetric label="Mesas sin movimiento +12 h" value={health?.stale_tables.length ?? 0} />
          <OperationalMetric label="Alertas últimas 24 h" value={health?.errors_last_24h ?? 0} alert={(health?.errors_last_24h ?? 0) > 0} />
        </section>
      )}

      <section className="rounded-2xl border border-border bg-surface p-4 shadow-sm">
        <h2 className="mb-3 text-sm font-bold text-foreground">Liquidaciones por estado</h2>
        <div className="flex flex-wrap gap-2">
          {treasury.by_status.map((status) => (
            <div key={status.status} className="flex items-center gap-2 rounded-xl border border-border px-3 py-2">
              <StatusBadge tone={STATUS_TONE[status.status as SettlementStatus] ?? "neutral"} label={STATUS_LABEL[status.status as SettlementStatus] ?? status.status} compact />
              <span className="text-xs text-muted-foreground">{status.count} · {formatMXN(status.total_to_transfer)}</span>
            </div>
          ))}
        </div>
      </section>

      <section className="space-y-3">
        <h2 className="text-sm font-bold text-foreground">A quién debes liquidar (mayor primero)</h2>
        {treasury.owed_by_tenant.length === 0 ? (
          <EmptyState icon={Landmark} title="Nada pendiente" description="No hay dinero por liquidar a ningún negocio ahora mismo." />
        ) : (
          <div className="grid gap-2">
            {treasury.owed_by_tenant.map((tenant) => (
              <div key={tenant.tenant_id} className="flex items-center justify-between gap-4 rounded-2xl border border-border bg-surface p-4 shadow-sm">
                <div className="min-w-0"><p className="truncate font-mono text-xs text-muted-foreground">{tenant.tenant_id}</p><p className="text-xs text-muted-foreground">{tenant.open_settlements} liquidación(es) pendiente(s)</p></div>
                <span className="shrink-0 text-lg font-bold tabular-nums text-foreground">{formatMXN(tenant.total_to_transfer)}</span>
              </div>
            ))}
          </div>
        )}
      </section>
    </>
  );
}

function OperationalMetric({ label, value, alert = false }: { label: string; value: number; alert?: boolean }) {
  return <div className="rounded-2xl border border-border bg-surface p-4"><p className="text-xs text-muted-foreground">{label}</p><p className={`mt-1 text-2xl font-bold tabular-nums ${alert ? "text-red-600" : "text-foreground"}`}>{value}</p></div>;
}

function AuditModule() {
  const { data, error, isLoading } = useSWR<{ events: PlatformEvent[] }>(
    "/api/platform/activity",
    swrFetcher,
  );

  if (isLoading) return <LoadingBlock message="Cargando auditoría…" variant="skeleton" />;
  if (error) return <InlineError message="No se pudo cargar la actividad reciente." />;
  if (!data?.events.length) return <EmptyState icon={ListChecks} title="Sin actividad" description="No hay eventos recientes para revisar." />;

  return (
    <section className="overflow-hidden rounded-2xl border border-border bg-surface">
      <div className="flex items-center justify-between border-b border-border-soft px-4 py-3 sm:px-5">
        <h2 className="text-sm font-bold text-foreground">Actividad reciente</h2>
        <span className="text-xs font-semibold tabular-nums text-muted-foreground">{data.events.length} eventos</span>
      </div>
      <ol className="divide-y divide-border-soft">
        {data.events.map((event) => (
          <li key={event.id} className="grid gap-2 px-4 py-4 sm:grid-cols-[minmax(0,1fr)_auto] sm:items-center sm:px-5">
            <div className="flex min-w-0 gap-3">
              <span className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-accent/10 text-accent"><ShieldCheck className="h-4 w-4" aria-hidden /></span>
              <div className="min-w-0"><p className="truncate text-sm font-bold text-foreground">{event.action}</p><p className="truncate text-xs text-muted-foreground">{event.entity_type} · {event.entity_id ?? "Sin identificador"}</p></div>
            </div>
            <time dateTime={event.created_at} className="pl-11 text-xs text-muted-foreground sm:pl-0">{new Date(event.created_at).toLocaleString("es-MX")}</time>
          </li>
        ))}
      </ol>
    </section>
  );
}

function InlineError({ message }: { message: string }) {
  return <div className="flex min-h-24 items-center gap-3 rounded-2xl border border-red-200 bg-red-50 p-4 text-sm font-semibold text-red-700" role="alert"><AlertTriangle className="h-5 w-5 shrink-0" aria-hidden />{message}</div>;
}
