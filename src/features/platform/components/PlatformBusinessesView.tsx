"use client";

import { useDeferredValue, useState } from "react";
import Link from "next/link";
import useSWR from "swr";
import {
  AlertTriangle,
  ArrowUpRight,
  Building2,
  CheckCircle2,
  CreditCard,
  LockKeyhole,
  MapPin,
  Search,
  Store,
  UserRound,
  XCircle,
} from "lucide-react";

import { EmptyState } from "@/components/admin/EmptyState";
import { StatusBadge } from "@/components/admin/StatusBadge";
import { FormSheet } from "@/components/ui/FormSheet";
import { LoadingBlock } from "@/components/ui/LoadingBlock";
import { PlatformPagination } from "@/features/platform/components/PlatformPagination";
import type { PlatformTenant, PlatformTenantsResponse } from "@/features/platform/types";
import { formatMXN } from "@/lib/loanUtils";
import { swrFetcher } from "@/lib/swrFetcher";

type Filter = "all" | "accepting_orders" | "paused" | "store_off";

const PLAN_LABELS: Record<string, string> = {
  free: "Gratis",
  operation: "Operación",
  growth: "Crecimiento",
  scale: "Escala",
};

function formatDate(value: string | null): string {
  if (!value) return "Sin actividad";
  return new Date(value).toLocaleDateString("es-MX", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

function businessStatus(tenant: PlatformTenant) {
  if (!tenant.public_store_enabled) {
    return { label: "Tienda apagada", tone: "neutral" as const };
  }
  if (!tenant.accepting_orders) {
    return { label: "Pedidos pausados", tone: "warning" as const };
  }
  return { label: "Operando", tone: "success" as const };
}

export function PlatformBusinessesView() {
  const [search, setSearch] = useState("");
  const deferredSearch = useDeferredValue(search.trim());
  const [filter, setFilter] = useState<Filter>("all");
  const [page, setPage] = useState(1);
  const [selectedTenant, setSelectedTenant] = useState<PlatformTenant | null>(null);

  const key = `/api/platform/tenants?page=${page}&per_page=10&status=${filter}&q=${encodeURIComponent(deferredSearch)}`;
  const { data, error, isLoading } = useSWR<PlatformTenantsResponse>(key, swrFetcher, {
    keepPreviousData: true,
  });

  function changeFilter(next: Filter) {
    setFilter(next);
    setPage(1);
  }

  if (isLoading && !data) {
    return <LoadingBlock message="Cargando negocios…" variant="skeleton" />;
  }
  if (error && !data) {
    return (
      <EmptyState
        icon={AlertTriangle}
        title="No pudimos cargar los negocios"
        description="Intenta actualizar la página."
        tone="muted"
      />
    );
  }

  const stats = data?.stats ?? { total: 0, accepting_orders: 0, paused: 0, store_off: 0 };
  const tenants = data?.tenants ?? [];

  return (
    <>
      <section className="grid grid-cols-2 gap-2 sm:grid-cols-4" aria-label="Resumen de negocios">
        <BusinessFilter label="Todos" value={stats.total} active={filter === "all"} onClick={() => changeFilter("all")} />
        <BusinessFilter label="Operando" value={stats.accepting_orders} active={filter === "accepting_orders"} onClick={() => changeFilter("accepting_orders")} tone="success" />
        <BusinessFilter label="Pausados" value={stats.paused} active={filter === "paused"} onClick={() => changeFilter("paused")} tone="warning" />
        <BusinessFilter label="Tienda apagada" value={stats.store_off} active={filter === "store_off"} onClick={() => changeFilter("store_off")} />
      </section>

      <section className="overflow-hidden rounded-2xl border border-border bg-surface">
        <div className="border-b border-border-soft p-3 sm:p-4">
          <label className="relative block">
            <span className="sr-only">Buscar negocios</span>
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" aria-hidden />
            <input
              type="search"
              value={search}
              onChange={(event) => {
                setSearch(event.target.value);
                setPage(1);
              }}
              placeholder="Buscar negocio, slug, giro o propietario"
              className="input-form min-h-11 w-full rounded-xl border border-border bg-surface-raised pl-10 pr-3 text-sm text-foreground outline-none transition focus:border-accent focus:ring-2 focus:ring-accent/20"
            />
          </label>
        </div>

        {tenants.length === 0 ? (
          <div className="p-4">
            <EmptyState icon={Building2} title="Sin resultados" description="Prueba otra búsqueda o cambia el filtro operativo." tone="muted" />
          </div>
        ) : (
          <>
            <div className="divide-y divide-border-soft lg:hidden">
              {tenants.map((tenant) => (
                <BusinessMobileCard key={tenant.id} tenant={tenant} onOpen={() => setSelectedTenant(tenant)} />
              ))}
            </div>
            <div className="hidden lg:block">
              <table className="w-full table-fixed text-left text-sm">
                <thead className="border-b border-border-soft bg-surface-raised text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
                  <tr>
                    <th className="w-[27%] px-5 py-3">Negocio</th>
                    <th className="w-[17%] px-4 py-3">Estado</th>
                    <th className="w-[16%] px-4 py-3">Plan</th>
                    <th className="w-[14%] px-4 py-3">Equipo</th>
                    <th className="w-[16%] px-4 py-3">30 días</th>
                    <th className="w-[10%] px-5 py-3 text-right">Acción</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border-soft">
                  {tenants.map((tenant) => {
                    const status = businessStatus(tenant);
                    return (
                      <tr key={tenant.id} className="transition-colors hover:bg-surface-raised/70">
                        <td className="px-5 py-3">
                          <p className="truncate font-bold text-foreground">{tenant.name}</p>
                          <p className="truncate text-xs text-muted-foreground">{tenant.owner?.email ?? `/${tenant.slug}`}</p>
                        </td>
                        <td className="px-4 py-3"><StatusBadge tone={status.tone} label={status.label} /></td>
                        <td className="px-4 py-3 font-semibold text-foreground">{PLAN_LABELS[tenant.billing.plan_code] ?? tenant.billing.plan_code}</td>
                        <td className="px-4 py-3 text-muted-foreground"><span className="font-semibold tabular-nums text-foreground">{tenant.team_active}</span> activos</td>
                        <td className="px-4 py-3"><p className="font-semibold tabular-nums text-foreground">{formatMXN(tenant.sales_30d)}</p><p className="text-xs text-muted-foreground">{tenant.orders_30d} pedidos</p></td>
                        <td className="px-5 py-3 text-right">
                          <button type="button" onClick={() => setSelectedTenant(tenant)} className="min-h-11 rounded-lg px-3 text-sm font-semibold text-accent transition-colors hover:bg-accent/10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent">Ver ficha</button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </>
        )}

        {data && <PlatformPagination page={data.page} totalPages={data.total_pages} total={data.total} itemLabel="negocios encontrados" onChange={setPage} />}
      </section>

      <BusinessDetailSheet tenant={selectedTenant} onClose={() => setSelectedTenant(null)} />
    </>
  );
}

function BusinessFilter({ label, value, active, onClick, tone = "default" }: { label: string; value: number; active: boolean; onClick: () => void; tone?: "default" | "success" | "warning" }) {
  const valueColor = tone === "success" ? "text-emerald-700" : tone === "warning" ? "text-amber-700" : "text-foreground";
  return (
    <button type="button" aria-pressed={active} onClick={onClick} className={`min-h-20 rounded-xl border p-3 text-left transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent ${active ? "border-accent bg-accent/5" : "border-border bg-surface hover:bg-surface-raised"}`}>
      <span className="block text-xs font-medium text-muted-foreground">{label}</span>
      <span className={`mt-1 block text-xl font-bold tabular-nums ${valueColor}`}>{value}</span>
    </button>
  );
}

function BusinessMobileCard({ tenant, onOpen }: { tenant: PlatformTenant; onOpen: () => void }) {
  const status = businessStatus(tenant);
  return (
    <article className="space-y-3 p-4">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0"><p className="truncate text-sm font-bold text-foreground">{tenant.name}</p><p className="truncate text-xs text-muted-foreground">/{tenant.slug}</p></div>
        <StatusBadge tone={status.tone} label={status.label} />
      </div>
      <div className="grid grid-cols-2 gap-3 rounded-xl bg-surface-raised p-3 text-xs">
        <div><p className="text-muted-foreground">Ventas 30 días</p><p className="mt-0.5 font-bold tabular-nums text-foreground">{formatMXN(tenant.sales_30d)}</p></div>
        <div><p className="text-muted-foreground">Operación</p><p className="mt-0.5 font-bold text-foreground">{tenant.open_orders} abiertas · {tenant.team_active} personas</p></div>
      </div>
      <button type="button" onClick={onOpen} className="min-h-11 w-full rounded-lg border border-border bg-surface px-3 text-sm font-semibold text-foreground">Ver información y acceso</button>
    </article>
  );
}

function BusinessDetailSheet({ tenant, onClose }: { tenant: PlatformTenant | null; onClose: () => void }) {
  const status = tenant ? businessStatus(tenant) : { label: "", tone: "neutral" as const };
  const location = tenant?.address
    ? [tenant.address.city, tenant.address.state, tenant.address.country].filter(Boolean).join(", ")
    : "Sin ubicación registrada";
  return (
    <FormSheet
      isOpen={Boolean(tenant)}
      onClose={onClose}
      title={tenant?.name ?? "Negocio"}
      description={tenant ? `/${tenant.slug}` : undefined}
      icon={Building2}
      maxWidth="max-w-3xl"
      footer={tenant ? (
        <div className="grid gap-2 sm:flex sm:justify-end">
          <button type="button" onClick={onClose} className="min-h-12 rounded-xl border border-border bg-surface px-4 text-sm font-semibold text-foreground">Cerrar</button>
          {tenant.public_store_enabled && (
            <Link href={`/sitio/${tenant.slug}`} target="_blank" className="inline-flex min-h-12 items-center justify-center gap-2 rounded-xl border border-border bg-surface px-4 text-sm font-semibold text-foreground">
              Abrir tienda pública <ArrowUpRight className="h-4 w-4" aria-hidden />
            </Link>
          )}
          {tenant.can_open_dashboard && (
            <Link href={`/dashboard/${tenant.slug}`} className="inline-flex min-h-12 items-center justify-center gap-2 rounded-xl bg-accent px-4 text-sm font-bold text-accent-foreground">
              Abrir panel <ArrowUpRight className="h-4 w-4" aria-hidden />
            </Link>
          )}
        </div>
      ) : null}
    >
      {tenant && (
        <div className="space-y-5">
          <div className="flex flex-wrap items-center gap-2">
            <StatusBadge tone={status.tone} label={status.label} />
            <StatusBadge tone="info" label={`Plan ${PLAN_LABELS[tenant.billing.plan_code] ?? tenant.billing.plan_code}`} />
          </div>

          <section className="grid grid-cols-2 gap-3 sm:grid-cols-4">
            <Metric label="Ventas 30 días" value={formatMXN(tenant.sales_30d)} />
            <Metric label="Pedidos 30 días" value={String(tenant.orders_30d)} />
            <Metric label="Órdenes abiertas" value={String(tenant.open_orders)} alert={tenant.open_orders > 0} />
            <Metric label="Mesas ocupadas" value={`${tenant.active_tables}/${tenant.tables_enabled}`} />
          </section>

          <section className="grid gap-3 sm:grid-cols-2">
            <InfoCard icon={UserRound} title="Responsable principal">
              <p className="font-semibold text-foreground">{tenant.owner?.display_name || "Sin propietario identificado"}</p>
              <p className="break-all text-xs text-muted-foreground">{tenant.owner?.email || "Sin correo registrado"}</p>
              {tenant.owner?.phone && <p className="text-xs text-muted-foreground">{tenant.owner.phone}</p>}
            </InfoCard>
            <InfoCard icon={MapPin} title="Ubicación y contacto">
              <p className="font-semibold text-foreground">{location}</p>
              <p className="text-xs text-muted-foreground">{tenant.address?.phone || tenant.whatsapp_phone || "Sin teléfono registrado"}</p>
            </InfoCard>
            <InfoCard icon={CreditCard} title="Plan y vigencia">
              <p className="font-semibold text-foreground">{PLAN_LABELS[tenant.billing.plan_code] ?? tenant.billing.plan_code}</p>
              <p className="text-xs capitalize text-muted-foreground">Estado: {tenant.billing.status.replaceAll("_", " ")}</p>
            </InfoCard>
            <InfoCard icon={Store} title="Actividad">
              <p className="font-semibold text-foreground">{tenant.team_active} miembros activos · {tenant.team_invited} invitados</p>
              <p className="text-xs text-muted-foreground">Último pedido: {formatDate(tenant.last_order_at)}</p>
            </InfoCard>
          </section>

          {tenant.description && <section><h3 className="text-sm font-bold text-foreground">Descripción</h3><p className="mt-1 text-sm text-muted-foreground">{tenant.description}</p></section>}

          <section className="grid gap-3 sm:grid-cols-2">
            <div className="rounded-xl border border-emerald-200 bg-emerald-50/70 p-4">
              <h3 className="flex items-center gap-2 text-sm font-bold text-emerald-800"><CheckCircle2 className="h-4 w-4" aria-hidden />Qué puedes hacer</h3>
              <ul className="mt-2 space-y-1.5 text-sm text-emerald-800/90">
                <li>Consultar su salud operativa, equipo, ventas y plan.</li>
                {tenant.public_store_enabled ? <li>Abrir y revisar la tienda pública.</li> : <li>Confirmar que la tienda pública está desactivada.</li>}
                {tenant.can_open_dashboard && <li>Entrar al panel porque tu cuenta ya tiene membresía.</li>}
              </ul>
            </div>
            <div className="rounded-xl border border-border bg-surface-raised p-4">
              <h3 className="flex items-center gap-2 text-sm font-bold text-foreground">{tenant.can_open_dashboard ? <CheckCircle2 className="h-4 w-4 text-emerald-600" aria-hidden /> : <LockKeyhole className="h-4 w-4 text-muted-foreground" aria-hidden />}Acceso al panel interno</h3>
              {tenant.can_open_dashboard ? (
                <p className="mt-2 text-sm text-muted-foreground">Puedes entrar con los permisos de la membresía que tu cuenta ya tiene. Las APIs siguen validando cada acción.</p>
              ) : (
                <div className="mt-2 flex gap-2 text-sm text-muted-foreground"><XCircle className="mt-0.5 h-4 w-4 shrink-0 text-muted-foreground" aria-hidden /><p>No puedes editar catálogo, pedidos, equipo ni configuración. Ser super admin no suplanta automáticamente al propietario; necesitas una membresía explícita.</p></div>
              )}
            </div>
          </section>
        </div>
      )}
    </FormSheet>
  );
}

function Metric({ label, value, alert = false }: { label: string; value: string; alert?: boolean }) {
  return <div className="rounded-xl bg-surface-raised p-3"><p className="text-xs text-muted-foreground">{label}</p><p className={`mt-1 text-lg font-bold tabular-nums ${alert ? "text-amber-700" : "text-foreground"}`}>{value}</p></div>;
}

function InfoCard({ icon: Icon, title, children }: { icon: typeof Building2; title: string; children: React.ReactNode }) {
  return <div className="flex gap-3 rounded-xl border border-border p-4"><span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-accent/10 text-accent"><Icon className="h-4 w-4" aria-hidden /></span><div className="min-w-0"><h3 className="text-xs font-bold uppercase tracking-wider text-muted-foreground">{title}</h3><div className="mt-1 text-sm">{children}</div></div></div>;
}
