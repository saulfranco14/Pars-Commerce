"use client";

import { useEffect, useState } from "react";
import { Loader2, Wallet } from "lucide-react";

import { FormSheet } from "@/components/ui/FormSheet";
import { btnWorkPrimary } from "@/components/ui/buttonClasses";
import { OPTION_CARD } from "@/components/wizard/wizardStyles";

import { formatCurrency } from "@/features/qr/helpers/format";
import { COUNTER_PAYMENT_METHODS, paymentMethodLabel } from "@/features/orders/constants/paymentMethods";

import type { IntentMethod } from "@/features/qr/services/tablePaymentService";
import type { CounterChargeSheetProps } from "@/features/operaciones/interfaces/boardComponents";

/** Caja charges right here: pick how the money came in, confirm, and the board moves on. */
export function CounterChargeSheet({ order, busy, onClose, onCharge }: CounterChargeSheetProps) {
  const [method, setMethod] = useState<IntentMethod | null>(null);
  useEffect(() => setMethod(null), [order?.id]);

  const due = Number(order?.balanceDue ?? order?.total ?? 0);
  const chosen = COUNTER_PAYMENT_METHODS.find((entry) => entry.id === method);

  return (
    <FormSheet
      isOpen={Boolean(order)}
      onClose={onClose}
      dismissible={!busy}
      icon={Wallet}
      title={order ? `Cobrar #${order.number}` : "Cobrar"}
      description={[order?.originLabel, order?.customerName].filter(Boolean).join(" · ")}
      maxWidth="max-w-md"
      footer={
        <button
          type="button"
          disabled={!method || busy}
          onClick={() => method && onCharge(method)}
          className={`${btnWorkPrimary} w-full`}
        >
          {busy ? <Loader2 className="h-4 w-4 animate-spin" aria-hidden /> : <Wallet className="h-4 w-4" aria-hidden />}
          {chosen ? `Recibí ${formatCurrency(due)} en ${paymentMethodLabel(chosen.label).toLowerCase()}` : "Elige cómo te pagó"}
        </button>
      }
    >
      <div className="space-y-5">
        <div className="text-center">
          <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Por cobrar</p>
          <p className="mt-1 text-5xl font-bold tracking-tight text-foreground tabular-nums">{formatCurrency(due)}</p>
        </div>
        <div className="grid grid-cols-3 gap-2" role="radiogroup" aria-label="Cómo te pagó">
          {COUNTER_PAYMENT_METHODS.map(({ id, label, icon: Icon }) => {
            const active = method === id;
            return (
              <button
                key={id}
                type="button"
                role="radio"
                aria-checked={active}
                disabled={busy}
                onClick={() => setMethod(id)}
                className={`${OPTION_CARD.base} ${active ? OPTION_CARD.selected : OPTION_CARD.idle} flex min-h-24 flex-col items-center justify-center gap-2 bg-surface p-3 disabled:opacity-60`}
              >
                <Icon className={`h-6 w-6 ${active ? "text-accent" : "text-muted-foreground"}`} aria-hidden />
                <span className="text-sm font-semibold text-foreground">{paymentMethodLabel(label)}</span>
              </button>
            );
          })}
        </div>
        <p className="text-center text-xs text-muted-foreground">Confirma solo con el dinero en la mano. El cliente verá su pedido pagado.</p>
      </div>
    </FormSheet>
  );
}
