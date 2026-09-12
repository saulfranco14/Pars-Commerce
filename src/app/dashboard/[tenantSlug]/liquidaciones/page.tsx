"use client";

import { useState, useEffect } from "react";
import { Wallet, Clock, CheckCircle2, Check } from "lucide-react";

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

  const { data, isLoading } = useSettlements(tenantId);
  const {
    data: configData,
    isLoading: configLoading,
    mutate: mutateConfig,
  } = useSettlementConfig(tenantId);

  const [saving, setSaving] = useState(false);
  // The cycle the user has selected in the UI, pending confirmation. Starts
  // from the saved value and only persists when they press "Actualizar" — no
  // accidental changes on click.
  const savedCycle = configData?.config.cycle_type;
  const [pendingCycle, setPendingCycle] = useState<SettlementCycle | null>(null);

  useEffect(() => {
    if (savedCycle) setPendingCycle(savedCycle);
  }, [savedCycle]);

  if (!tenant) {
    return (
      <div className="text-sm text-muted-foreground">
        Selecciona un negocio para continuar.
      </div>
    );
  }

  const hasChange = pendingCycle != null && pendingCycle !== savedCycle;

  async function handleSaveCycle() {
    if (!tenantId || !pendingCycle || !hasChange) return;
    setSaving(true);
    try {
      await updateSettlementConfig({
        tenant_id: tenantId,
        cycle_type: pendingCycle,
      });
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
            selected={pendingCycle ?? configData.config.cycle_type}
            onSelect={setPendingCycle}
            saving={saving}
          />
          <div className="mt-3 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
            <p className="text-xs text-muted-foreground">
              El cambio aplica desde tu próxima liquidación. El dinero ya
              acumulado se te paga normal.
            </p>
            <button
              type="button"
              onClick={handleSaveCycle}
              disabled={!hasChange || saving}
              className="inline-flex shrink-0 items-center justify-center gap-2 rounded-xl bg-accent px-5 py-2.5 text-sm font-semibold text-white transition-opacity hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-40"
            >
              <Check className="h-4 w-4" />
              {saving ? "Actualizando…" : "Actualizar frecuencia"}
            </button>
          </div>
        </section>
      ) : null}

      {/* Settlements list */}
      <section className="space-y-3">
        <h2 className="text-sm font-bold text-foreground">Historial</h2>
        {isLoading ? (
          <LoadingBlock message="Cargando liquidaciones…" />
        ) : data && data.settlements.length > 0 ? (
          <div className="grid gap-3">
            {data.settlements.map((s) => (
              <SettlementCard key={s.id} settlement={s} />
            ))}
          </div>
        ) : (
          // No liquidaciones is the NORMAL state for a business that just
          // started — show a friendly empty state, not an alarming error, even
          // if the fetch failed transiently (SWR will retry in background).
          <EmptyState
            icon={Wallet}
            title="Aún no tienes liquidaciones"
            description="Cuando recibas pagos por Mercado Pago, aquí verás cuánto se te va a transferir y cuándo."
          />
        )}
      </section>
    </div>
  );
}
