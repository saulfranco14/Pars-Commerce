"use client";

import Link from "next/link";
import { useState } from "react";
import { AlertTriangle, CreditCard, Eye, Store, TrendingUp, UserPlus, Users } from "lucide-react";

import { usePlatformOverview } from "@/features/platform/hooks/usePlatformOverview";
import { EmptyState } from "@/components/admin/EmptyState";
import { MetricsStrip } from "@/components/admin/MetricsStrip";
import { StatusBadge } from "@/components/admin/StatusBadge";
import { FilterTabs } from "@/components/ui/FilterTabs";
import { LoadingBlock } from "@/components/ui/LoadingBlock";
import { Notification } from "@/components/ui/Notification";
import { OverviewChart } from "@/features/platform/components/OverviewChart";

import { formatMXN } from "@/lib/loanUtils";

const RANGES = [
  { value: "7", label: "7 días" },
  { value: "30", label: "30 días" },
  { value: "90", label: "90 días" },
];

function share(part: number, total: number): string {
  return total ? `${Math.round((part / total) * 100)} %` : "—";
}

/** How the platform is doing: who signs up, who can charge, who sells and who visits the stores. */
export function PlatformOverviewView() {
  const [days, setDays] = useState(30);
  const { overview, health, error, isLoading } = usePlatformOverview(days);

  if (isLoading && !overview) return <LoadingBlock message="Cargando operación…" variant="skeleton" />;
  if (error || !overview) return <EmptyState icon={AlertTriangle} title="Sin acceso" description="Esta sección es solo para administradores de la plataforma." />;

  const delta = overview.registrations - overview.registrations_prev;
  const funnel = [
    { label: "Registrados", value: overview.funnel.registered },
    { label: "Tienda lista", value: overview.funnel.store_ready },
    { label: "Cobros conectados", value: overview.funnel.mp_connected },
    { label: "Primera venta", value: overview.funnel.first_sale },
    { label: "Activos (5+ pedidos en 30 días)", value: overview.funnel.active },
  ];
  const funnelMax = Math.max(funnel[0].value, 1);
  const engine = (overview.by_acquisition.engine ?? 0) + (overview.by_acquisition.assisted ?? 0);

  return (
    <div className="grid gap-5">
      <FilterTabs tabs={RANGES} activeValue={String(days)} onTabChange={(value) => setDays(Number(value))} ariaLabel="Periodo" />

      <MetricsStrip
        metrics={[
          { label: "Negocios registrados", value: overview.registrations, icon: UserPlus, tone: "accent", hint: `${delta >= 0 ? "+" : ""}${delta} vs. periodo anterior · ${engine} por el equipo` },
          { label: "Tiendas publicadas", value: overview.stores_published, icon: Store, hint: `${share(overview.stores_published, overview.tenants)} de ${overview.tenants}` },
          { label: "Cobran con Mercado Pago", value: overview.mp_connected, icon: CreditCard, tone: "emerald", hint: `${share(overview.mp_connected, overview.tenants)} de los negocios` },
          { label: "Venta de los negocios", value: formatMXN(overview.sales), icon: TrendingUp, hint: `${overview.orders.toLocaleString("es-MX")} pedidos pagados` },
          { label: "Visitas a tiendas", value: overview.visits.toLocaleString("es-MX"), icon: Eye, hint: `${overview.visitors.toLocaleString("es-MX")} visitantes` },
          { label: "Usuarios activos 7 días", value: overview.active_users_7d, icon: Users, hint: "Entraron a la app" },
        ]}
      />

      {overview.alerts.mp_problem || overview.alerts.published_without_products || overview.alerts.open_settlements || health?.errors_last_24h ? (
        <div className="grid gap-2">
          {overview.alerts.mp_problem ? (
            <Notification tone="error" title={`${overview.alerts.mp_problem} ${overview.alerts.mp_problem === 1 ? "negocio" : "negocios"} con Mercado Pago desconectado`} message="Su permiso venció o lo revocaron. No pueden cobrar hasta reconectar." />
          ) : null}
          {overview.alerts.published_without_products ? (
            <Notification tone="warning" title={`${overview.alerts.published_without_products} ${overview.alerts.published_without_products === 1 ? "tienda publicada" : "tiendas publicadas"} sin productos`} message="Sus clientes ven una tienda vacía." />
          ) : null}
          {health?.errors_last_24h ? <Notification tone="warning" title={`${health.errors_last_24h} alertas en las últimas 24 h`} message="Webhooks fallidos o inventario negativo; revisa Auditoría." /> : null}
          {overview.alerts.open_settlements ? (
            <Notification
              tone="info"
              title={`${overview.alerts.open_settlements} liquidaciones del esquema anterior siguen abiertas`}
              message={<Link href="/dashboard/plataforma?view=liquidaciones" className="font-semibold underline">Ver liquidaciones</Link>}
            />
          ) : null}
        </div>
      ) : null}

      <div className="grid gap-4 lg:grid-cols-2">
        <OverviewChart title="Registros por día" description="Negocios nuevos cada día." data={overview.registrations_by_day} kind="line" valueLabel="Registros" />
        <OverviewChart title="Visitas a tiendas por día" description="Páginas vistas en las tiendas públicas." data={overview.visits_by_day} kind="bar" valueLabel="Visitas" />
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <section className="grid gap-3 rounded-2xl border border-border bg-surface p-4" aria-label="Embudo de activación">
          <div>
            <h2 className="text-sm font-bold text-foreground">Embudo de activación</h2>
            <p className="text-xs text-muted-foreground">Dónde se atoran los negocios después de registrarse (todos, no sólo el periodo).</p>
          </div>
          <ul className="grid gap-2">
            {funnel.map((step) => (
              <li key={step.label} className="grid grid-cols-[minmax(0,9rem)_minmax(0,1fr)_3rem] items-center gap-2 text-sm">
                <span className="truncate text-muted-foreground">{step.label}</span>
                <span className="h-3 overflow-hidden rounded-full bg-border-soft"><span className="block h-full rounded-full bg-accent" style={{ width: `${(step.value / funnelMax) * 100}%` }} /></span>
                <b className="text-right tabular-nums text-foreground">{step.value}</b>
              </li>
            ))}
          </ul>
        </section>

        <section className="grid gap-3 rounded-2xl border border-border bg-surface p-4" aria-label="Tiendas más visitadas">
          <h2 className="text-sm font-bold text-foreground">Tiendas más visitadas</h2>
          {overview.top_stores.length ? (
            <div className="overflow-x-auto">
              <table className="w-full min-w-[420px] text-left text-sm">
                <thead className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground">
                  <tr><th className="py-2">Negocio</th><th>Visitas</th><th>Pedidos</th><th>Mercado Pago</th></tr>
                </thead>
                <tbody className="divide-y divide-border-soft">
                  {overview.top_stores.map((store) => (
                    <tr key={store.tenant_id}>
                      <td className="py-2"><a href={`/sitio/${store.slug}`} target="_blank" rel="noopener noreferrer" className="font-semibold text-foreground hover:underline">{store.name}</a></td>
                      <td className="tabular-nums">{store.visits.toLocaleString("es-MX")}</td>
                      <td className="tabular-nums">{store.orders}</td>
                      <td><StatusBadge tone={store.mp_connected ? "success" : "warning"} label={store.mp_connected ? "Conectado" : "Sin conectar"} compact /></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : <p className="text-sm text-muted-foreground">Las visitas se cuentan desde hoy; aquí aparecerán las tiendas con más tráfico.</p>}
        </section>
      </div>

      {health ? (
        <section className="grid gap-3 sm:grid-cols-3" aria-label="Estado operativo">
          <div className="rounded-2xl border border-border bg-surface p-4"><p className="text-xs text-muted-foreground">Órdenes abiertas</p><p className="mt-1 text-2xl font-bold tabular-nums text-foreground">{health.open_orders}</p></div>
          <div className="rounded-2xl border border-border bg-surface p-4"><p className="text-xs text-muted-foreground">Mesas sin movimiento +12 h</p><p className="mt-1 text-2xl font-bold tabular-nums text-foreground">{health.stale_tables.length}</p></div>
          <div className="rounded-2xl border border-border bg-surface p-4"><p className="text-xs text-muted-foreground">Alertas últimas 24 h</p><p className={`mt-1 text-2xl font-bold tabular-nums ${health.errors_last_24h ? "text-red-600" : "text-foreground"}`}>{health.errors_last_24h}</p></div>
        </section>
      ) : null}
    </div>
  );
}
