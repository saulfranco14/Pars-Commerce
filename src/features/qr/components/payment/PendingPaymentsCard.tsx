"use client";

import { Check, Loader2, RefreshCw, X } from "lucide-react";

import {
  adminActionButtonConfirm,
  adminActionButtonDanger,
} from "@/components/admin/actionButtonClasses";
import { formatCurrency } from "@/features/qr/helpers/format";
import { PAYMENT_METHOD_META } from "@/features/qr/constants/paymentMethodMeta";

import type { CustomerPayMethod } from "@/features/qr/components/payment/CustomerPayModal";
import type { AdminViewPendingPayment } from "@/features/qr/services/tableAdminViewService";

interface PendingPaymentsCardProps {
  payments: AdminViewPendingPayment[];
  busyPaymentId: string | null;
  onConfirm: (paymentId: string) => void;
  onReject: (paymentId: string) => void;
  onRefresh?: () => void;
  refreshing?: boolean;
}

function resolveMethodMeta(method: string) {
  const key = (method as CustomerPayMethod) in PAYMENT_METHOD_META
    ? (method as CustomerPayMethod)
    : "efectivo";
  return PAYMENT_METHOD_META[key];
}

export function PendingPaymentsCard({
  payments,
  busyPaymentId,
  onConfirm,
  onReject,
  onRefresh,
  refreshing = false,
}: PendingPaymentsCardProps) {
  if (payments.length === 0) return null;
  const actionsLocked = busyPaymentId !== null;

  return (
    <section className="rounded-2xl border border-amber-200 bg-amber-50/80 p-4 shadow-sm sm:p-5">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex min-w-0 items-start gap-3">
          <span className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-amber-100 text-amber-800">
            <Loader2 className="h-4 w-4 animate-spin" aria-hidden />
          </span>
          <div className="min-w-0">
            <h2 className="text-sm font-bold text-amber-950">
              Pagos por validar ({payments.length})
            </h2>
            <p className="mt-0.5 text-xs leading-5 text-amber-900/80">
              Confirma sólo el dinero recibido o rechaza para que el cliente pueda intentarlo de nuevo.
            </p>
          </div>
        </div>
        {onRefresh && (
          <button
            type="button"
            onClick={onRefresh}
            disabled={refreshing || actionsLocked}
            className="inline-flex min-h-(--touch-target,44px) shrink-0 cursor-pointer items-center justify-center gap-2 rounded-lg border border-amber-300 bg-surface px-4 py-2.5 text-sm font-medium text-amber-950 transition-colors hover:bg-amber-100 disabled:cursor-not-allowed disabled:opacity-60 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-300 focus-visible:ring-offset-2"
          >
            <RefreshCw className={`h-3.5 w-3.5 ${refreshing ? "animate-spin" : ""}`} />
            Actualizar
          </button>
        )}
      </div>

      <ul className="mt-4 space-y-3">
        {payments.map((p) => {
          const meta = resolveMethodMeta(p.method);
          const Icon = meta.icon;
          const isBusy = busyPaymentId === p.id;
          return (
            <li
              key={p.id}
              className="grid gap-4 rounded-xl border border-amber-200/80 bg-surface p-4 shadow-sm sm:grid-cols-[minmax(0,1fr)_auto] sm:items-center"
            >
              <div className="flex items-start gap-3">
                <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-border-soft/50">
                  <Icon className="h-4 w-4 text-muted-foreground" />
                </span>
                <div className="min-w-0">
                  <p className="text-sm font-bold text-foreground">
                    {formatCurrency(p.payable_amount)} · {meta.label}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {p.device_name ? `${p.device_name}` : "Cliente"}
                    {p.group_label ? ` · ${p.group_label}` : ""}
                  </p>
                  {p.tip_amount > 0 && (
                    <p className="mt-1 text-xs font-medium text-muted-foreground">
                      Cuenta {formatCurrency(p.amount)} + propina {formatCurrency(p.tip_amount)}
                    </p>
                  )}
                </div>
              </div>

              <div className="grid w-full grid-cols-2 gap-2 sm:w-auto sm:min-w-70">
                <button
                  type="button"
                  onClick={() => onReject(p.id)}
                  disabled={actionsLocked}
                  className={`${adminActionButtonDanger} w-full justify-center`}
                >
                  <X className="h-4 w-4" />
                  Rechazar
                </button>
                <button
                  type="button"
                  onClick={() => onConfirm(p.id)}
                  disabled={actionsLocked}
                  className={`${adminActionButtonConfirm} w-full justify-center`}
                >
                  {isBusy ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <Check className="h-4 w-4" />
                  )}
                  Confirmar
                </button>
              </div>
            </li>
          );
        })}
      </ul>
    </section>
  );
}
