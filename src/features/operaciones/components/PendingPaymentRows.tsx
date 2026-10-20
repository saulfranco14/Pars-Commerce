"use client";

import { Check, Loader2, X } from "lucide-react";

import { adminActionButtonConfirm, adminActionButtonDanger } from "@/components/admin/actionButtonClasses";

import { PAYMENT_METHOD_META } from "@/features/qr/constants/paymentMethodMeta";
import { formatCurrency } from "@/features/qr/helpers/format";

import type { CustomerPayMethod } from "@/features/qr/components/payment/CustomerPayModal";
import type { PendingPaymentRowsProps } from "@/features/operaciones/interfaces/boardComponents";

/** Same confirmation Mesas uses: settles the customer's account and records the tip. */
export function PendingPaymentRows({ payments, busyPaymentId, onConfirm, onReject }: PendingPaymentRowsProps) {
  return (
    <ul className="space-y-2">
      {payments.map((p) => {
        const meta = PAYMENT_METHOD_META[p.method as CustomerPayMethod] ?? PAYMENT_METHOD_META.efectivo;
        const Icon = meta.icon;
        const busy = busyPaymentId === p.id;
        return (
          <li key={p.id} className="rounded-xl border border-amber-200 bg-amber-50 p-3 dark:border-amber-900/50 dark:bg-amber-950/30">
            <div className="flex items-start gap-2">
              <Icon className="mt-0.5 h-4 w-4 shrink-0 text-amber-800 dark:text-amber-300" aria-hidden />
              <div className="min-w-0 flex-1">
                <p className="text-base font-bold tabular-nums text-foreground">
                  {formatCurrency(p.amount + p.tip)} · {meta.label}
                </p>
                <p className="text-xs text-muted-foreground">
                  {p.tip > 0 ? `Cuenta ${formatCurrency(p.amount)} + propina ${formatCurrency(p.tip)}` : "Sin propina"}
                  {p.payerName ? ` · ${p.payerName}` : ""}
                </p>
              </div>
            </div>
            <div className="mt-3 flex gap-2">
              <button type="button" disabled={busy} onClick={() => onConfirm(p.id)} className={`${adminActionButtonConfirm} flex-1`}>
                {busy ? <Loader2 className="h-4 w-4 animate-spin" aria-hidden /> : <Check className="h-4 w-4" aria-hidden />}
                Recibí el dinero
              </button>
              <button type="button" disabled={busy} onClick={() => onReject(p.id)} className={`${adminActionButtonDanger} flex-1`}>
                <X className="h-4 w-4" aria-hidden />
                No llegó
              </button>
            </div>
          </li>
        );
      })}
    </ul>
  );
}
