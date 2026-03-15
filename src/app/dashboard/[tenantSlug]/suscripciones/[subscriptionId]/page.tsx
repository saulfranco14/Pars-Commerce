"use client";

import { useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import useSWR, { mutate } from "swr";
import {
  ArrowLeft,
  Loader2,
  Repeat,
  CalendarCheck,
  Pause,
  XCircle,
  Package,
  CreditCard,
  ExternalLink,
} from "lucide-react";
import { btnPrimary, btnDanger, btnSecondary } from "@/components/ui/buttonClasses";
import { BottomSheet } from "@/components/ui/BottomSheet";
import { useActiveTenant } from "@/stores/useTenantStore";
import { swrFetcher } from "@/lib/swrFetcher";
import { formatOrderDateFull } from "@/lib/formatDate";
import {
  subscriptionStatusLabel,
  subscriptionStatusColor,
  subscriptionTypeLabel,
  freqLabel,
} from "@/features/suscripciones/helpers/subscriptionLabels";
import type {
  Subscription,
  SubscriptionPayment,
  SubscriptionPaymentStatus,
} from "@/types/subscriptions";

type SubscriptionDetail = Subscription & {
  payments: SubscriptionPayment[];
};

function PaymentStatusBadge({ status }: { status: SubscriptionPaymentStatus }) {
  const map: Record<SubscriptionPaymentStatus, { label: string; cls: string }> = {
    paid: { label: "Pagado", cls: "bg-emerald-100 text-emerald-800" },
    failed: { label: "Fallido", cls: "bg-red-100 text-red-800" },
    refunded: { label: "Reembolsado", cls: "bg-amber-100 text-amber-800" },
  };
  const { label, cls } = map[status] ?? { label: status, cls: "bg-gray-100 text-gray-700" };
  return (
    <span className={`inline-flex rounded-full px-2 py-0.5 text-xs font-medium ${cls}`}>
      {label}
    </span>
  );
}

export default function SubscriptionDetailPage() {
  const params = useParams();
  const router = useRouter();
  const tenantSlug = params.tenantSlug as string;
  const subscriptionId = params.subscriptionId as string;
  const activeTenant = useActiveTenant();

  const [actionLoading, setActionLoading] = useState(false);
  const [confirmAction, setConfirmAction] = useState<"pause" | "cancel" | null>(null);

  const swrKey = subscriptionId
    ? `/api/subscriptions?subscription_id=${subscriptionId}`
    : null;
  const { data: sub, isLoading, error } = useSWR<SubscriptionDetail>(
    swrKey,
    swrFetcher,
    { revalidateOnFocus: false },
  );

  async function handleAction(action: "pause" | "cancel") {
    setActionLoading(true);
    try {
      const res = await fetch("/api/subscriptions", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ subscription_id: subscriptionId, action }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        alert((data as { error?: string }).error ?? "Error al procesar la acción");
        return;
      }
      await mutate(swrKey);
      // Also invalidate the list
      if (activeTenant?.id) {
        await mutate(
          (key: unknown) =>
            typeof key === "string" && key.startsWith("/api/subscriptions?tenant_id="),
          undefined,
          { revalidate: true },
        );
      }
    } finally {
      setActionLoading(false);
      setConfirmAction(null);
    }
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="h-6 w-6 animate-spin text-muted" />
      </div>
    );
  }

  if (error || !sub) {
    return (
      <div className="space-y-4">
        <Link
          href={`/dashboard/${tenantSlug}/suscripciones`}
          className="inline-flex items-center gap-1 text-sm text-muted hover:text-foreground"
        >
          <ArrowLeft className="h-4 w-4" /> Volver
        </Link>
        <div className="rounded-xl border border-border bg-surface-raised py-12 text-center">
          <p className="text-sm text-muted">Suscripción no encontrada</p>
        </div>
      </div>
    );
  }

  const isInstallments = sub.type === "installments";
  const canPause = sub.status === "active";
  const canCancel = ["active", "paused", "pending_setup", "card_failed"].includes(sub.status);
  const progress = isInstallments && sub.total_installments
    ? Math.round((sub.completed_installments / sub.total_installments) * 100)
    : null;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-3">
        <Link
          href={`/dashboard/${tenantSlug}/suscripciones`}
          className="inline-flex min-h-[44px] min-w-[44px] items-center justify-center rounded-lg text-muted hover:bg-border-soft hover:text-foreground"
        >
          <ArrowLeft className="h-5 w-5" />
        </Link>
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2">
            {isInstallments ? (
              <CalendarCheck className="h-5 w-5 text-accent" />
            ) : (
              <Repeat className="h-5 w-5 text-accent" />
            )}
            <h1 className="truncate text-lg font-bold text-foreground">
              {sub.customer_name}
            </h1>
          </div>
          <p className="text-xs text-muted">
            {subscriptionTypeLabel(sub.type)} · {freqLabel(sub.frequency, sub.frequency_type)}
          </p>
        </div>
        <span
          className={`shrink-0 rounded-full px-3 py-1 text-xs font-medium ${subscriptionStatusColor(sub.status)}`}
        >
          {subscriptionStatusLabel(sub.status)}
        </span>
      </div>

      {/* Info cards */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {/* Amount card */}
        <div className="rounded-xl border border-border bg-surface-raised p-4">
          <p className="text-xs font-medium uppercase text-muted">Monto por cobro</p>
          <p className="mt-1 text-2xl font-bold text-foreground">
            ${sub.charge_amount.toFixed(2)}
          </p>
          {sub.discount_percent > 0 && (
            <p className="mt-0.5 text-xs text-emerald-600">
              Descuento: {sub.discount_percent}%
            </p>
          )}
          {sub.service_fee_per_charge > 0 && (
            <p className="mt-0.5 text-xs text-muted">
              Incluye tarifa de servicio: ${sub.service_fee_per_charge.toFixed(2)}
            </p>
          )}
        </div>

        {/* Progress card */}
        <div className="rounded-xl border border-border bg-surface-raised p-4">
          <p className="text-xs font-medium uppercase text-muted">Progreso</p>
          {isInstallments && sub.total_installments ? (
            <>
              <p className="mt-1 text-2xl font-bold text-foreground">
                {sub.completed_installments}/{sub.total_installments}
              </p>
              <div className="mt-2 h-2 overflow-hidden rounded-full bg-border-soft">
                <div
                  className="h-full rounded-full bg-accent transition-all"
                  style={{ width: `${progress}%` }}
                />
              </div>
            </>
          ) : (
            <>
              <p className="mt-1 text-2xl font-bold text-foreground">
                {sub.completed_installments}
              </p>
              <p className="text-xs text-muted">cobros realizados</p>
            </>
          )}
        </div>

        {/* Totals card */}
        <div className="rounded-xl border border-border bg-surface-raised p-4">
          <p className="text-xs font-medium uppercase text-muted">Original</p>
          <p className="mt-1 text-lg font-semibold text-foreground">
            ${sub.original_amount.toFixed(2)}
          </p>
          {sub.discount_percent > 0 && (
            <p className="text-xs text-muted">
              Con descuento: ${sub.discounted_amount.toFixed(2)}
            </p>
          )}
        </div>
      </div>

      {/* Customer info */}
      <div className="rounded-xl border border-border bg-surface-raised p-4">
        <p className="text-xs font-medium uppercase text-muted">Cliente</p>
        <p className="mt-1 font-medium text-foreground">{sub.customer_name}</p>
        <p className="text-sm text-muted">{sub.customer_email}</p>
        {sub.customer_phone && (
          <p className="text-sm text-muted">{sub.customer_phone}</p>
        )}
      </div>

      {/* Items snapshot */}
      {sub.items_snapshot && sub.items_snapshot.length > 0 && (
        <div className="rounded-xl border border-border bg-surface-raised p-4">
          <p className="mb-3 text-xs font-medium uppercase text-muted">Productos</p>
          <div className="space-y-2">
            {sub.items_snapshot.map((item, i) => (
              <div key={i} className="flex items-center gap-3">
                {item.image_url ? (
                  <img
                    src={item.image_url}
                    alt={item.name}
                    className="h-10 w-10 rounded-lg object-cover"
                  />
                ) : (
                  <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-border-soft">
                    <Package className="h-5 w-5 text-muted" />
                  </div>
                )}
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium text-foreground">{item.name}</p>
                  <p className="text-xs text-muted">
                    {item.quantity} × ${item.unit_price.toFixed(2)}
                  </p>
                </div>
                <p className="text-sm font-medium text-foreground">
                  ${(item.quantity * item.unit_price).toFixed(2)}
                </p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Payments history */}
      <div className="rounded-xl border border-border bg-surface-raised p-4">
        <p className="mb-3 text-xs font-medium uppercase text-muted">Historial de cobros</p>
        {sub.payments && sub.payments.length > 0 ? (
          <div className="space-y-2">
            {sub.payments
              .sort((a, b) => b.installment_number - a.installment_number)
              .map((p) => (
                <div
                  key={p.id}
                  className="flex items-center gap-3 rounded-lg border border-border-soft p-3"
                >
                  <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-border-soft">
                    <CreditCard className="h-4 w-4 text-muted" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-medium text-foreground">
                      Cobro #{p.installment_number}
                    </p>
                    <p className="text-xs text-muted">
                      {formatOrderDateFull(p.created_at)}
                    </p>
                  </div>
                  <PaymentStatusBadge status={p.status} />
                  <p className="text-sm font-semibold text-foreground">
                    ${p.amount.toFixed(2)}
                  </p>
                </div>
              ))}
          </div>
        ) : (
          <p className="text-sm text-muted">Sin cobros registrados aún</p>
        )}
      </div>

      {/* MP link */}
      {sub.mp_preapproval_id && (
        <div className="rounded-xl border border-border bg-surface-raised p-4">
          <p className="text-xs font-medium uppercase text-muted">MercadoPago</p>
          <p className="mt-1 font-mono text-xs text-muted break-all">
            ID: {sub.mp_preapproval_id}
          </p>
          {sub.mp_subscription_init_point && (
            <a
              href={sub.mp_subscription_init_point}
              target="_blank"
              rel="noopener noreferrer"
              className="mt-2 inline-flex items-center gap-1 text-xs font-medium text-accent hover:underline"
            >
              <ExternalLink className="h-3.5 w-3.5" />
              Ver en MercadoPago
            </a>
          )}
        </div>
      )}

      {/* Actions */}
      {(canPause || canCancel) && (
        <div className="flex flex-col gap-3 sm:flex-row">
          {canPause && (
            <button
              type="button"
              className={btnSecondary}
              onClick={() => setConfirmAction("pause")}
              disabled={actionLoading}
            >
              <Pause className="h-4 w-4" />
              Pausar suscripción
            </button>
          )}
          {canCancel && (
            <button
              type="button"
              className={btnDanger}
              onClick={() => setConfirmAction("cancel")}
              disabled={actionLoading}
            >
              <XCircle className="h-4 w-4" />
              Cancelar suscripción
            </button>
          )}
        </div>
      )}

      {/* Confirm action bottom sheet */}
      <BottomSheet
        isOpen={confirmAction !== null}
        onClose={() => setConfirmAction(null)}
        title={confirmAction === "pause" ? "Pausar suscripción" : "Cancelar suscripción"}
      >
        <div className="space-y-4 p-4">
          <p className="text-sm text-muted">
            {confirmAction === "pause"
              ? "¿Estás seguro de pausar esta suscripción? Los cobros automáticos se detendrán hasta que la reactives."
              : "¿Estás seguro de cancelar esta suscripción? Esta acción no se puede deshacer y se cancelará también en MercadoPago."}
          </p>
          <div className="flex gap-3">
            <button
              type="button"
              className={btnSecondary + " flex-1"}
              onClick={() => setConfirmAction(null)}
              disabled={actionLoading}
            >
              Volver
            </button>
            <button
              type="button"
              className={(confirmAction === "cancel" ? btnDanger : btnPrimary) + " flex-1"}
              onClick={() => confirmAction && handleAction(confirmAction)}
              disabled={actionLoading}
            >
              {actionLoading ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : confirmAction === "pause" ? (
                "Sí, pausar"
              ) : (
                "Sí, cancelar"
              )}
            </button>
          </div>
        </div>
      </BottomSheet>
    </div>
  );
}
