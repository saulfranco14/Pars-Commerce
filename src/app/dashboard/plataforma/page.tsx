"use client";

import { useState } from "react";
import useSWR from "swr";
import { Landmark, AlertTriangle, Building2, ListChecks, ShieldCheck, TrendingUp, Users } from "lucide-react";

import { swrFetcher } from "@/lib/swrFetcher";
import { PageHeader } from "@/components/admin/PageHeader";
import { MetricsStrip } from "@/components/admin/MetricsStrip";
import { EmptyState } from "@/components/admin/EmptyState";
import { LoadingBlock } from "@/components/ui/LoadingBlock";
import { StatusBadge } from "@/components/admin/StatusBadge";
import { formatMXN } from "@/lib/loanUtils";
import { STATUS_LABEL, STATUS_TONE } from "@/features/settlement/constants/labels";
import type { SettlementStatus } from "@/types/settlement";
import type { PlatformDashboard } from "@/types/settlementDashboard";

/**
 * Platform treasury board (super admin only). The endpoint enforces
 * isPlatformAdmin server-side; a non-admin gets a 403 which surfaces here as
 * the "no access" state.
 */
export default function PlataformaPage() {
  const { data, error, isLoading } = useSWR<PlatformDashboard>(
    "/api/settlement-dashboard",
    swrFetcher,
  );

  if (isLoading) {
    return <LoadingBlock message="Cargando tesorería…" />;
  }

  if (error) {
    return (
      <EmptyState
        icon={AlertTriangle}
        title="Sin acceso"
        description="Esta sección es solo para administradores de la plataforma."
      />
    );
  }

  if (!data) return null;

  return <PlatformConsole treasury={data} />;
}

type PlatformUser = { id: string; email: string; display_name: string; email_confirmed_at: string | null; last_sign_in_at: string | null; businesses: number; banned_until: string | null };
type PlatformTenant = { id: string; name: string; slug: string; team_active: number; team_invited: number; active_tables: number; tables_enabled: number; sales_30d: number; open_orders: number };
type PlatformEvent = { id: string; action: string; entity_type: string; entity_id: string | null; created_at: string; tenant_id: string | null };

function PlatformConsole({ treasury: data }: { treasury: PlatformDashboard }) {
  const [view, setView] = useState<"operation" | "users" | "businesses" | "audit">("operation");
  const { data: usersData, mutate: mutateUsers } = useSWR<{ users: PlatformUser[] }>(view === "users" ? "/api/platform/users" : null, swrFetcher);
  const { data: tenantsData } = useSWR<{ tenants: PlatformTenant[] }>(view === "businesses" ? "/api/platform/tenants" : null, swrFetcher);
  const { data: activityData } = useSWR<{ events: PlatformEvent[] }>(view === "audit" ? "/api/platform/activity" : null, swrFetcher);
  const { data: health } = useSWR<{ open_orders: number; stale_tables: Array<{ id: string; table_label: string | null }>; errors_last_24h: number }>(view === "operation" ? "/api/platform/operation-health" : null, swrFetcher);

  async function changeUser(user: PlatformUser, status: "suspended" | "active") {
    const reason = status === "suspended" ? prompt("Motivo de la suspensión:") : undefined;
    if (status === "suspended" && !reason?.trim()) return;
    const res = await fetch(`/api/platform/users/${user.id}/status`, { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ status, reason }) });
    if (!res.ok) alert((await res.json()).error ?? "No se pudo actualizar el usuario");
    await mutateUsers();
  }

  async function resendVerification(user: PlatformUser) {
    const res = await fetch(`/api/platform/users/${user.id}/resend-verification`, { method: "POST" });
    const payload = await res.json() as { error?: string };
    if (!res.ok) alert(payload.error ?? "No se pudo reenviar el correo");
    else alert("Correo de verificación reenviado.");
  }

  return (
    <div className="space-y-5">
      <PageHeader
        eyebrow="Plataforma"
        title="Tesorería"
        description="Cuánto debes liquidar, a quién, qué falta confirmar y la comisión ya cobrada — de todos los negocios."
      />

      <div className="grid grid-cols-2 gap-2 rounded-2xl border border-border bg-surface p-2 sm:grid-cols-4">
        {[
          ["operation", "Operación", ShieldCheck], ["users", "Usuarios", Users], ["businesses", "Negocios", Building2], ["audit", "Auditoría", ListChecks],
        ].map(([key, label, Icon]) => <button key={key as string} type="button" onClick={() => setView(key as typeof view)} className={`min-h-11 rounded-xl px-3 text-sm font-semibold transition ${view === key ? "bg-accent text-white" : "text-muted-foreground hover:bg-surface-raised"}`}><Icon className="mr-1 inline h-4 w-4" />{label as string}</button>)}
      </div>

      <MetricsStrip
        metrics={[
          {
            label: "Por liquidar (total)",
            value: formatMXN(data.total_outstanding),
            tone: "amber",
            icon: Landmark,
          },
          {
            label: "Comisión cobrada",
            value: formatMXN(data.commission_confirmed),
            tone: "emerald",
            icon: TrendingUp,
          },
          {
            label: "Requieren acción",
            value: data.needs_action,
            tone: data.needs_action > 0 ? "accent" : "default",
            icon: ListChecks,
          },
          {
            label: "En revisión",
            value: data.disputed,
            tone: data.disputed > 0 ? "red" : "default",
            icon: AlertTriangle,
          },
        ]}
      />

      {view === "operation" && <section className="grid gap-3 sm:grid-cols-3">
        <div className="rounded-2xl border border-border bg-surface p-4"><p className="text-xs text-muted-foreground">Órdenes abiertas</p><p className="mt-1 text-2xl font-bold">{health?.open_orders ?? "—"}</p></div>
        <div className="rounded-2xl border border-border bg-surface p-4"><p className="text-xs text-muted-foreground">Mesas sin movimiento +12 h</p><p className="mt-1 text-2xl font-bold">{health?.stale_tables.length ?? "—"}</p></div>
        <div className="rounded-2xl border border-border bg-surface p-4"><p className="text-xs text-muted-foreground">Alertas últimas 24 h</p><p className="mt-1 text-2xl font-bold">{health?.errors_last_24h ?? "—"}</p></div>
      </section>}

      {view === "users" && <section className="space-y-2 rounded-2xl border border-border bg-surface p-4"><h2 className="font-bold">Usuarios de Tlaco</h2>{(usersData?.users ?? []).map((user) => <div key={user.id} className="flex flex-wrap items-center justify-between gap-3 border-t border-border-soft py-3 text-sm"><div><p className="font-semibold">{user.display_name || user.email}</p><p className="text-muted-foreground">{user.email} · {user.businesses} negocio(s) · {user.email_confirmed_at ? "correo confirmado" : "correo pendiente"}</p></div><div className="flex w-full gap-2 sm:w-auto">{!user.email_confirmed_at && <button type="button" onClick={() => resendVerification(user)} className="min-h-11 flex-1 rounded-lg border border-border px-3 font-semibold sm:flex-none">Reenviar correo</button>}<button type="button" onClick={() => changeUser(user, user.banned_until ? "active" : "suspended")} className="min-h-11 flex-1 rounded-lg border border-border px-3 font-semibold sm:flex-none">{user.banned_until ? "Reactivar" : "Suspender"}</button></div></div>)}</section>}
      {view === "businesses" && <section className="space-y-2 rounded-2xl border border-border bg-surface p-4"><h2 className="font-bold">Negocios y operación</h2>{(tenantsData?.tenants ?? []).map((tenant) => <div key={tenant.id} className="grid gap-1 border-t border-border-soft py-3 text-sm sm:grid-cols-4"><p className="font-semibold">{tenant.name}</p><p>{tenant.team_active} activos · {tenant.team_invited} invitados</p><p>{tenant.active_tables}/{tenant.tables_enabled} mesas con pedido</p><p>{formatMXN(tenant.sales_30d)} · {tenant.open_orders} abiertas</p></div>)}</section>}
      {view === "audit" && <section className="space-y-2 rounded-2xl border border-border bg-surface p-4"><h2 className="font-bold">Auditoría</h2>{(activityData?.events ?? []).map((event) => <div key={event.id} className="flex justify-between gap-3 border-t border-border-soft py-3 text-sm"><div><p className="font-semibold">{event.action}</p><p className="text-muted-foreground">{event.entity_type} · {event.entity_id ?? "—"}</p></div><time className="text-muted-foreground">{new Date(event.created_at).toLocaleString("es-MX")}</time></div>)}</section>}

      {/* By status */}
      <section className="rounded-2xl border border-border bg-surface p-4 shadow-sm">
        <h2 className="mb-3 text-sm font-bold text-foreground">
          Liquidaciones por estado
        </h2>
        <div className="flex flex-wrap gap-2">
          {data.by_status.map((s) => (
            <div
              key={s.status}
              className="flex items-center gap-2 rounded-xl border border-border px-3 py-2"
            >
              <StatusBadge
                tone={STATUS_TONE[s.status as SettlementStatus] ?? "neutral"}
                label={STATUS_LABEL[s.status as SettlementStatus] ?? s.status}
                compact
              />
              <span className="text-xs text-muted-foreground">
                {s.count} · {formatMXN(s.total_to_transfer)}
              </span>
            </div>
          ))}
        </div>
      </section>

      {/* Owed by tenant — who to pay next */}
      <section className="space-y-3">
        <h2 className="text-sm font-bold text-foreground">
          A quién debes liquidar (mayor primero)
        </h2>
        {data.owed_by_tenant.length === 0 ? (
          <EmptyState
            icon={Landmark}
            title="Nada pendiente"
            description="No hay dinero por liquidar a ningún negocio ahora mismo."
          />
        ) : (
          <div className="grid gap-2">
            {data.owed_by_tenant.map((t) => (
              <div
                key={t.tenant_id}
                className="flex items-center justify-between rounded-2xl border border-border bg-surface p-4 shadow-sm"
              >
                <div className="min-w-0">
                  <p className="truncate font-mono text-xs text-muted-foreground">
                    {t.tenant_id}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {t.open_settlements} liquidación(es) pendiente(s)
                  </p>
                </div>
                <span className="text-lg font-bold text-foreground">
                  {formatMXN(t.total_to_transfer)}
                </span>
              </div>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
