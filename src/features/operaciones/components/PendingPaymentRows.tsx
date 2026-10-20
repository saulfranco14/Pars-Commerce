"use client";

import { Check, Loader2, X } from "lucide-react";

import { btnWorkDanger, btnWorkSuccess } from "@/components/ui/buttonClasses";

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
          <li key={p.id} className="rounded-xl border border-border bg-surface p-3 shadow-sm">
            <div className="flex items-start gap-3">
              <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-amber-100 text-amber-700 dark:bg-amber-500/15 dark:text-amber-300">
                <Icon className="h-5 w-5" aria-hidden />
              </span>
              <div className="min-w-0 flex-1">
                <p className="flex flex-wrap items-center gap-2 text-lg font-bold tabular-nums text-foreground">
                  {formatCurrency(p.amount + p.tip)}
                  <span className="rounded-full bg-amber-100 px-2 py-0.5 text-[11px] font-bold uppercase tracking-wide text-amber-800 dark:bg-amber-500/15 dark:text-amber-300">
                    {meta.label} · por confirmar
                  </span>
                </p>
                <p className="text-xs text-muted-foreground">
                  {p.tip > 0 ? `Cuenta ${formatCurrency(p.amount)} + propina ${formatCurrency(p.tip)}` : "Sin propina"}
                  {p.payerName ? ` · ${p.payerName}` : ""}
                </p>
              </div>
            </div>
            <div className="mt-3 grid grid-cols-[repeat(auto-fit,minmax(10rem,1fr))] gap-2">
              <button type="button" disabled={busy} onClick={() => onConfirm(p.id)} className={btnWorkSuccess}>
                {busy ? <Loader2 className="h-4 w-4 animate-spin" aria-hidden /> : <Check className="h-4 w-4" aria-hidden />}
                Recibí el dinero
              </button>
              <button type="button" disabled={busy} onClick={() => onReject(p.id)} className={btnWorkDanger}>
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
