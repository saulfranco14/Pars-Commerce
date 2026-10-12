"use client";

import { useState, useEffect } from "react";
import { Check, X, DollarSign, Loader2 } from "lucide-react";
import {
  PAYMENT_METHODS,
  type PaymentMethodId,
} from "@/features/orders/constants/paymentMethods";
import type { ConfirmPaymentModalProps } from "@/features/orders/interfaces/orderModals";
import { btnSecondary } from "@/components/ui/buttonClasses";

export function ConfirmPaymentModal({
  isOpen,
  onClose,
  onConfirm,
  total,
  lockedPaymentMethod = null,
  loading = false,
}: ConfirmPaymentModalProps) {
  const [selected, setSelected] = useState<PaymentMethodId>("efectivo");
  const fixedMethod = normalizePaymentMethod(lockedPaymentMethod);

  useEffect(() => {
    if (isOpen) setSelected(fixedMethod ?? "efectivo");
  }, [fixedMethod, isOpen]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (loading) return;
    await onConfirm(selected);
    onClose();
  }

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-100 flex flex-col justify-end md:items-center md:justify-center bg-black/60 p-0 md:p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="confirm-payment-title"
      onClick={loading ? undefined : onClose}
    >
      <div
        className="flex max-h-[92dvh] w-full max-w-md flex-col overflow-hidden rounded-t-[28px] border-t border-border-soft bg-surface-raised shadow-2xl md:max-h-none md:rounded-3xl md:border"
        onClick={(e) => e.stopPropagation()}
        style={{
          paddingBottom: "max(1rem, env(safe-area-inset-bottom))",
        }}
      >
        <div className="flex shrink-0 justify-center pt-3 md:hidden">
          <div
            className="h-1 w-12 rounded-full bg-muted-foreground/30"
            aria-hidden
          />
        </div>
        <div className="flex-1 min-h-0 overflow-y-auto overscroll-contain px-4 pb-4 pt-2 md:pt-6">
          <div className="flex items-center justify-between">
            <h3
              id="confirm-payment-title"
              className="text-lg font-semibold text-foreground"
            >
              Confirmar pago
            </h3>
          </div>
          <p className="mt-2 text-sm text-muted-foreground">Total a cobrar</p>
          <p className="text-2xl font-bold text-foreground">
            ${Number(total).toFixed(2)}
          </p>
          <p className="mt-4 text-sm font-medium text-foreground">
            {fixedMethod ? "Método elegido por el cliente" : "Selecciona el método de pago:"}
          </p>
          <form
            id="confirm-payment-form"
            onSubmit={handleSubmit}
            className="mt-3 space-y-3"
          >
            <div className={`grid gap-2 ${fixedMethod ? "grid-cols-1" : "grid-cols-2"}`}>
              {PAYMENT_METHODS.filter(({ id }) => !fixedMethod || id === fixedMethod).map(({ id, label, icon: Icon, colorClass }) => {
                const isSelected = selected === id;
                return (
                  <button
                    key={id}
                    type="button"
                    onClick={() => {
                      if (!fixedMethod) setSelected(id);
                    }}
                    disabled={loading}
                    className={`relative flex min-h-11 cursor-pointer flex-col items-center justify-center gap-1 rounded-lg border px-3 py-2.5 text-left transition-colors duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2 ${
                      isSelected
                        ? "border-accent bg-accent/5"
                        : "border-border bg-surface hover:bg-border-soft/50"
                    }`}
                  >
                    {isSelected && (
                        <span
                        className="absolute right-2 top-2 text-accent"
                        aria-hidden
                      >
                        <Check className="h-4 w-4" />
                      </span>
                    )}
                    <Icon
                      className={`h-6 w-6 shrink-0 ${colorClass}`}
                      aria-hidden
                    />
                    <span
                      className={`text-xs font-medium ${
                        isSelected ? "text-accent" : "text-muted-foreground"
                      }`}
                    >
                          {label}
                        </span>
                        {fixedMethod ? <span className="text-xs text-muted-foreground">No se puede cambiar en esta orden.</span> : null}
                  </button>
                );
              })}
            </div>
          </form>
        </div>
        <div className="shrink-0 flex flex-col-reverse gap-2 px-4 pt-2 pb-4 md:flex-row md:gap-3 md:px-6 md:pt-4 md:pb-6 md:border-t md:border-border-soft">
          <button
            type="button"
            onClick={onClose}
            disabled={loading}
            className={`${btnSecondary} min-h-12 w-full rounded-xl text-base md:max-w-35`}
          >
            <X className="h-4 w-4" aria-hidden />
            Cancelar
          </button>
          <button
            type="submit"
            form="confirm-payment-form"
            disabled={loading}
            className="flex min-h-12 w-full cursor-pointer items-center justify-center gap-2 rounded-xl bg-accent px-4 py-3 text-base font-semibold text-accent-foreground shadow-sm transition-all duration-200 hover:bg-accent/90 active:scale-[0.98] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-70"
          >
            {loading ? <Loader2 className="h-5 w-5 shrink-0 animate-spin" aria-hidden /> : <DollarSign className="h-5 w-5 shrink-0" aria-hidden />}
            {loading ? "Confirmando pago…" : "Confirmar cobro"}
          </button>
        </div>
      </div>
    </div>
  );
}

function normalizePaymentMethod(value?: string | null): PaymentMethodId | null {
  if (value === "bank_transfer" || value === "transferencia") return "transferencia";
  if (value === "cash" || value === "efectivo") return "efectivo";
  if (value === "mercadopago") return "mercadopago";
  if (value === "card" || value === "tarjeta") return "tarjeta";
  return null;
}
