"use client";

import { Check, Loader2, X } from "lucide-react";

import {
  adminActionButtonConfirm,
  adminActionButtonDanger,
} from "@/components/admin/actionButtonClasses";
import { formatCurrency } from "@/features/qr/helpers/format";
import { PAYMENT_METHOD_META } from "@/features/qr/constants/paymentMethodMeta";

import type { CustomerPayMethod } from "@/features/qr/components/CustomerPayModal";
import type { AdminViewPendingPayment } from "@/features/qr/services/tableAdminViewService";

interface PendingPaymentsCardProps {
  payments: AdminViewPendingPayment[];
  busyPaymentId: string | null;
  onConfirm: (paymentId: string) => void;
  onReject: (paymentId: string) => void;
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
}: PendingPaymentsCardProps) {
  if (payments.length === 0) return null;

  return (
    <section className="rounded-xl border border-amber-200 bg-amber-50 p-4">
      <div className="flex items-center gap-2">
        <span className="inline-flex h-7 w-7 items-center justify-center rounded-full bg-amber-200 text-amber-800">
          <Loader2 className="h-3.5 w-3.5 animate-spin" />
        </span>
        <div>
          <h2 className="text-sm font-semibold text-amber-900">
            Pagos por validar ({payments.length})
          </h2>
          <p className="text-xs text-amber-800">
            Confirma o rechaza cada pago para liberar la cuenta.
          </p>
        </div>
      </div>

      <ul className="mt-3 space-y-2">
        {payments.map((p) => {
          const meta = resolveMethodMeta(p.method);
          const Icon = meta.icon;
          const isBusy = busyPaymentId === p.id;
          return (
            <li
              key={p.id}
              className="flex flex-col gap-3 rounded-lg border border-amber-200 bg-surface p-3 sm:flex-row sm:items-center sm:justify-between"
            >
              <div className="flex items-start gap-3">
                <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-border-soft/50">
                  <Icon className="h-4 w-4 text-muted-foreground" />
                </span>
                <div className="min-w-0">
                  <p className="text-sm font-semibold text-foreground">
                    {formatCurrency(p.amount)} · {meta.label}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {p.device_name ? `${p.device_name}` : "Cliente"}
                    {p.group_label ? ` · ${p.group_label}` : ""}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => onReject(p.id)}
                  disabled={isBusy}
                  className={adminActionButtonDanger}
                >
                  <X className="h-4 w-4" />
                  Rechazar
                </button>
                <button
                  type="button"
                  onClick={() => onConfirm(p.id)}
                  disabled={isBusy}
                  className={adminActionButtonConfirm}
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
