"use client";

import useSWR from "swr";
import { AlertTriangle, Landmark, ListChecks, TrendingUp } from "lucide-react";

import { EmptyState } from "@/components/admin/EmptyState";
import { MetricsStrip } from "@/components/admin/MetricsStrip";
import { StatusBadge } from "@/components/admin/StatusBadge";
import { LoadingBlock } from "@/components/ui/LoadingBlock";

import { STATUS_LABEL, STATUS_TONE } from "@/features/settlement/constants/labels";
import { formatMXN } from "@/lib/loanUtils";
import { swrFetcher } from "@/lib/swrFetcher";

import type { SettlementStatus } from "@/types/settlement";
import type { PlatformDashboard } from "@/types/settlementDashboard";

/** Settlements of the old scheme, where Tlaco collected and paid businesses out; Mercado Pago now pays them directly. */
export function SettlementsView() {
  const { data: treasury, error, isLoading } = useSWR<PlatformDashboard>("/api/settlement-dashboard", swrFetcher);

  if (isLoading) return <LoadingBlock message="Cargando liquidaciones…" variant="skeleton" />;
  if (error || !treasury) return <EmptyState icon={AlertTriangle} title="Sin acceso" description="Esta sección es solo para administradores de la plataforma." />;

  return (
    <div className="grid gap-5">
      <MetricsStrip
        metrics={[
          { label: "Por liquidar (total)", value: formatMXN(treasury.total_outstanding), tone: "amber", icon: Landmark },
          { label: "Comisión cobrada", value: formatMXN(treasury.commission_confirmed), tone: "emerald", icon: TrendingUp },
          { label: "Requieren acción", value: treasury.needs_action, tone: treasury.needs_action > 0 ? "accent" : "default", icon: ListChecks },
          { label: "En revisión", value: treasury.disputed, tone: treasury.disputed > 0 ? "red" : "default", icon: AlertTriangle },
        ]}
      />

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
    </div>
  );
}
