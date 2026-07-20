"use client";

import useSWR from "swr";
import { Landmark, AlertTriangle, ListChecks, TrendingUp } from "lucide-react";

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

  return (
    <div className="space-y-5">
      <PageHeader
        eyebrow="Plataforma"
        title="Tesorería"
        description="Cuánto debes liquidar, a quién, qué falta confirmar y la comisión ya cobrada — de todos los negocios."
      />

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
