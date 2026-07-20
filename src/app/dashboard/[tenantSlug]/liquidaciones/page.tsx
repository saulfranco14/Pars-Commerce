"use client";

import { useState } from "react";
import { Wallet, Clock, CheckCircle2 } from "lucide-react";

import { useActiveTenant } from "@/stores/useTenantStore";
import { PageHeader } from "@/components/admin/PageHeader";
import { MetricsStrip } from "@/components/admin/MetricsStrip";
import { EmptyState } from "@/components/admin/EmptyState";
import { LoadingBlock } from "@/components/ui/LoadingBlock";
import { formatMXN } from "@/lib/loanUtils";
import {
  useSettlements,
  useSettlementConfig,
} from "@/features/settlement/hooks/useSettlements";
import { SettlementCard } from "@/features/settlement/components/SettlementCard";
import { CyclePicker } from "@/features/settlement/components/CyclePicker";
import { SettlementOnboardingOverlay } from "@/components/onboarding/SettlementOnboardingOverlay";
import { CYCLE_LABEL } from "@/features/settlement/constants/labels";
import { updateSettlementConfig } from "@/services/settlementService";
import type { SettlementCycle } from "@/types/settlement";

export default function LiquidacionesPage() {
  const tenant = useActiveTenant();
  const tenantId = tenant?.id ?? null;

  const { data, isLoading, error } = useSettlements(tenantId);
  const {
    data: configData,
    isLoading: configLoading,
    mutate: mutateConfig,
  } = useSettlementConfig(tenantId);

  const [saving, setSaving] = useState(false);

  if (!tenant) {
    return (
      <div className="text-sm text-muted-foreground">
        Selecciona un negocio para continuar.
      </div>
    );
  }

  async function handleCycleChange(cycle: SettlementCycle) {
    if (!tenantId || cycle === configData?.config.cycle_type) return;
    setSaving(true);
    try {
      await updateSettlementConfig({ tenant_id: tenantId, cycle_type: cycle });
      await mutateConfig();
    } finally {
      setSaving(false);
    }
  }

  const summary = data?.summary;

  return (
    <div className="space-y-5">
      <SettlementOnboardingOverlay />
      <PageHeader
        title="Mi dinero"
        description="Tus liquidaciones de Mercado Pago: cuánto tienes por recibir, cuánto ya recibiste, y cada cuándo se te transfiere."
      />

      {summary && (
        <MetricsStrip
          metrics={[
            {
              label: "Por recibir",
              value: formatMXN(summary.pending_to_receive),
              tone: "amber",
              icon: Clock,
            },
            {
              label: "Ya recibido",
              value: formatMXN(summary.confirmed_received),
              tone: "emerald",
              icon: CheckCircle2,
            },
            {
              label: "Frecuencia",
              value: configData ? CYCLE_LABEL[configData.config.cycle_type] : "—",
              icon: Wallet,
            },
          ]}
        />
      )}

      {/* Cycle configuration */}
      {configLoading ? (
        <LoadingBlock message="Cargando tu frecuencia…" />
      ) : configData ? (
        <section className="rounded-2xl border border-border bg-surface p-4 shadow-sm">
          <h2 className="mb-3 text-sm font-bold text-foreground">
            ¿Cada cuándo quieres recibir tu dinero?
          </h2>
          <CyclePicker
            preview={configData.preview}
            previewBasis={configData.preview_basis}
            selected={configData.config.cycle_type}
            onSelect={handleCycleChange}
            saving={saving}
          />
          <p className="mt-2 text-xs text-muted-foreground">
            El cambio aplica desde tu próxima liquidación. El dinero ya
            acumulado se te paga normal.
          </p>
        </section>
      ) : null}

      {/* Settlements list */}
      <section className="space-y-3">
        <h2 className="text-sm font-bold text-foreground">Historial</h2>
        {isLoading ? (
          <LoadingBlock message="Cargando liquidaciones…" />
        ) : error ? (
          <p className="text-sm text-red-600">
            No se pudieron cargar tus liquidaciones.
          </p>
        ) : !data || data.settlements.length === 0 ? (
          <EmptyState
            icon={Wallet}
            title="Aún no tienes liquidaciones"
            description="Cuando recibas pagos por Mercado Pago, aquí verás cuánto se te va a transferir y cuándo."
          />
        ) : (
          <div className="grid gap-3">
            {data.settlements.map((s) => (
              <SettlementCard key={s.id} settlement={s} />
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
