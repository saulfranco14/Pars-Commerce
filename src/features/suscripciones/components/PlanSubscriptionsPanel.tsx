"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { AlertTriangle, CircleDollarSign, Repeat, Users, XCircle } from "lucide-react";

import { usePlanSubscriptions } from "@/features/suscripciones/hooks/usePlanSubscriptions";
import { EmptyState } from "@/components/admin/EmptyState";
import { MetricsStrip } from "@/components/admin/MetricsStrip";
import { ConfirmDialog } from "@/components/ui/ConfirmDialog";
import { FilterTabs } from "@/components/ui/FilterTabs";
import { LoadingBlock } from "@/components/ui/LoadingBlock";
import { Notification } from "@/components/ui/Notification";
import { Toast } from "@/components/ui/Toast";
import { PlanSubscriptionCard } from "@/features/suscripciones/components/PlanSubscriptionCard";

import { formatCurrency } from "@/features/qr/helpers/format";

import type { PlanSubscriptionRow } from "@/features/suscripciones/interfaces/planSubscription";

const EMPTY_TAB_COPY: Record<string, string> = {
  por_cobrar: "Nadie tiene un periodo pendiente de pago.",
  activas: "No hay suscripciones al corriente en este momento.",
  vencidas: "Nadie se ha atrasado con un pago.",
  pendientes: "No hay primeros pagos por confirmar.",
  terminadas: "Aún no se ha cancelado ni completado ninguna.",
};

export function PlanSubscriptionsPanel({ tenantId, plansHref }: { tenantId: string; plansHref: string }) {
  const list = usePlanSubscriptions(tenantId);
  const [origin, setOrigin] = useState("");
  const [toCancel, setToCancel] = useState<PlanSubscriptionRow | null>(null);
  const [copied, setCopied] = useState(false);

  useEffect(() => setOrigin(window.location.origin), []);
  const clearCopied = useCallback(() => setCopied(false), []);

  async function copyLink(url: string) {
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
    } catch {
      window.prompt("Copia el enlace del cliente:", url);
    }
  }

  if (list.isLoading) return <LoadingBlock variant="skeleton" skeletonRows={4} />;

  if (!list.hasAny) {
    return (
      <EmptyState
        icon={Repeat}
        title="Aún no tienes suscriptores"
        description="Cuando un cliente compre una suscripción en tu tienda, aquí verás qué periodos cobrar y a quién recordarle."
        action={
          <Link href={plansHref} className="inline-flex min-h-11 items-center justify-center rounded-xl bg-accent px-4 text-sm font-semibold text-accent-foreground hover:bg-accent-hover">
            Ver mis suscripciones en venta
          </Link>
        }
      />
    );
  }

  return (
    <div className="space-y-5">
      <MetricsStrip
        metrics={[
          { label: "Por cobrar", value: formatCurrency(list.toCollect), tone: list.toCollect > 0 ? "amber" : "default", icon: CircleDollarSign },
          { label: "Activas", value: list.counts.activas + list.counts.por_cobrar, tone: "emerald", icon: Users },
          { label: "Vencidas", value: list.counts.vencidas, tone: list.counts.vencidas > 0 ? "red" : "default", icon: AlertTriangle },
          { label: "Primer pago", value: list.counts.pendientes, icon: Repeat },
        ]}
      />

      <FilterTabs tabs={list.tabs} activeValue={list.tab} onTabChange={list.setTab} ariaLabel="Filtrar suscripciones" />

      {list.loadError ? <Notification tone="error" message="No pudimos cargar las suscripciones. Intenta de nuevo." /> : null}

      {list.rows.length === 0 ? (
        <p className="rounded-2xl border border-dashed border-border p-6 text-center text-sm text-muted-foreground">{EMPTY_TAB_COPY[list.tab]}</p>
      ) : (
        <ul className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-3">
          {list.rows.map((row) => (
            <li key={row.id}>
              <PlanSubscriptionCard
                row={row}
                origin={origin}
                busy={list.busyId === row.id}
                onCopyLink={(url) => void copyLink(url)}
                onCancelNow={() => setToCancel(row)}
                onCancelAtEnd={() => void list.act(row.id, "cancel_period_end")}
                onResume={() => void list.act(row.id, "resume")}
              />
            </li>
          ))}
        </ul>
      )}

      <ConfirmDialog
        isOpen={Boolean(toCancel)}
        onClose={() => setToCancel(null)}
        onConfirm={async () => {
          if (toCancel) await list.act(toCancel.id, "cancel_now");
          setToCancel(null);
        }}
        title="¿Cancelar esta suscripción ahora?"
        description="Se cancela también el pedido del periodo que aún no está pagado. Lo ya pagado no se toca."
        confirmLabel="Cancelar ahora"
        cancelLabel="Volver"
        variant="danger"
        icon={XCircle}
        loading={Boolean(toCancel && list.busyId === toCancel.id)}
      />

      {list.notice ? <Toast message={list.notice.message} tone={list.notice.tone} onDone={list.clearNotice} /> : null}
      {copied ? <Toast message="Enlace copiado." onDone={clearCopied} /> : null}
    </div>
  );
}
