"use client";

import { useEffect, useState } from "react";
import { Loader2, Wallet } from "lucide-react";

import { FormSheet } from "@/components/ui/FormSheet";
import { Notification } from "@/components/ui/Notification";
import { OPTION_CARD } from "@/components/wizard/wizardStyles";

import { formatCurrency } from "@/features/qr/helpers/format";
import { COUNTER_PAYMENT_METHODS, paymentMethodLabel } from "@/features/orders/constants/paymentMethods";
import { declareOrderPayment } from "@/features/orders/services/trackedOrderPaymentClient";

import type { IntentMethod } from "@/features/qr/services/tablePaymentService";
import type { TrackedOrderPaySheetProps } from "@/features/orders/interfaces/trackedOrderPayment";

const HINTS: Record<IntentMethod, string> = {
  efectivo: "Pagas en el negocio.",
  tarjeta: "Pagas con tarjeta en el negocio.",
  transferencia: "Transfiere y avísanos; el negocio lo confirmará.",
};

/** Same idea as paying at a table: the customer says how, the business confirms the money. */
export function TrackedOrderPaySheet({ open, token, total, bankAccount, onClose, onDeclared }: TrackedOrderPaySheetProps) {
  const [method, setMethod] = useState<IntentMethod | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  useEffect(() => {
    if (open) {
      setMethod(null);
      setError(null);
    }
  }, [open]);

  const methods = COUNTER_PAYMENT_METHODS.filter((entry) => entry.id !== "transferencia" || bankAccount);

  async function declare() {
    if (!method) return;
    setBusy(true);
    setError(null);
    try {
      await declareOrderPayment(token, method);
      onDeclared();
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "No pudimos avisar tu pago. Intenta de nuevo.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <FormSheet
      isOpen={open}
      onClose={onClose}
      dismissible={!busy}
      icon={Wallet}
      title="¿Cómo vas a pagar?"
      description="El negocio confirmará tu pago y aquí verás tu pedido pagado."
      maxWidth="max-w-md"
      footer={
        <button
          type="button"
          disabled={!method || busy}
          onClick={() => void declare()}
          className="flex min-h-14 w-full items-center justify-center gap-2 rounded-2xl bg-blue-600 px-5 text-base font-bold text-white transition-colors hover:bg-blue-700 disabled:opacity-60"
        >
          {busy ? <Loader2 className="h-5 w-5 animate-spin" aria-hidden /> : <Wallet className="h-5 w-5" aria-hidden />}
          {method ? `Avisar que pago ${formatCurrency(total)}` : "Elige un método"}
        </button>
      }
    >
      <div className="space-y-4">
        <p className="text-center text-5xl font-bold tracking-tight text-foreground tabular-nums">{formatCurrency(total)}</p>
        {error ? <Notification tone="error" message={error} /> : null}
        <div className="space-y-2" role="radiogroup" aria-label="Método de pago">
          {methods.map(({ id, label, icon: Icon }) => {
            const active = method === id;
            return (
              <button
                key={id}
                type="button"
                role="radio"
                aria-checked={active}
                onClick={() => setMethod(id)}
                className={`${OPTION_CARD.base} ${active ? OPTION_CARD.selected : OPTION_CARD.idle} flex min-h-16 w-full items-center gap-3 bg-surface px-4`}
              >
                <Icon className={`h-5 w-5 shrink-0 ${active ? "text-accent" : "text-muted-foreground"}`} aria-hidden />
                <span className="min-w-0">
                  <span className="block font-semibold text-foreground">{paymentMethodLabel(label)}</span>
                  <span className="block text-xs text-muted-foreground">{HINTS[id]}</span>
                </span>
              </button>
            );
          })}
        </div>
        {method === "transferencia" && bankAccount ? (
          <dl className="space-y-1 rounded-2xl border border-border bg-surface p-4 text-sm">
            {bankAccount.bank_name ? <div className="flex justify-between gap-3"><dt className="text-muted-foreground">Banco</dt><dd className="font-semibold text-foreground">{bankAccount.bank_name}</dd></div> : null}
            {bankAccount.account_holder ? <div className="flex justify-between gap-3"><dt className="text-muted-foreground">Titular</dt><dd className="font-semibold text-foreground">{bankAccount.account_holder}</dd></div> : null}
            {bankAccount.clabe ? <div className="flex justify-between gap-3"><dt className="text-muted-foreground">CLABE</dt><dd className="font-mono font-semibold text-foreground">{bankAccount.clabe}</dd></div> : null}
            {bankAccount.account_number ? <div className="flex justify-between gap-3"><dt className="text-muted-foreground">Cuenta</dt><dd className="font-mono font-semibold text-foreground">{bankAccount.account_number}</dd></div> : null}
          </dl>
        ) : null}
      </div>
    </FormSheet>
  );
}
