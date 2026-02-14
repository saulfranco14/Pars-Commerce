"use client";

import { useState, useEffect } from "react";
import { Banknote, Building2, CreditCard, Smartphone, Check, X, DollarSign } from "lucide-react";

const PAYMENT_METHODS = [
  { id: "efectivo", label: "EFECTIVO", icon: Banknote, colorClass: "text-emerald-600" },
  { id: "transferencia", label: "TRANSFERENCIA", icon: Building2, colorClass: "text-violet-600" },
  { id: "tarjeta", label: "TARJETA", icon: CreditCard, colorClass: "text-blue-600" },
  { id: "mercadopago", label: "MERCADO PAGO", icon: Smartphone, colorClass: "text-blue-600" },
] as const;

type PaymentMethodId = (typeof PAYMENT_METHODS)[number]["id"];

interface ConfirmPaymentModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (paymentMethod: string) => Promise<void>;
  total: number;
  loading?: boolean;
}

export function ConfirmPaymentModal({
  isOpen,
  onClose,
  onConfirm,
  total,
  loading = false,
}: ConfirmPaymentModalProps) {
  const [selected, setSelected] = useState<PaymentMethodId>("efectivo");

  useEffect(() => {
    if (isOpen) setSelected("efectivo");
  }, [isOpen]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (loading) return;
    await onConfirm(selected);
    onClose();
  }

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-10 flex items-center justify-center bg-black/40 p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="confirm-payment-title"
      onClick={onClose}
    >
      <div
        className="w-full max-w-md rounded-xl border border-border-soft bg-surface-raised p-6 shadow-lg"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between">
          <h3
            id="confirm-payment-title"
            className="text-lg font-semibold text-foreground"
          >
            Confirmar pago
          </h3>
          <button
            type="button"
            onClick={onClose}
            disabled={loading}
            className="min-h-[44px] min-w-[44px] cursor-pointer rounded-lg p-2 text-muted-foreground transition-colors duration-200 hover:bg-border-soft hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/50 focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
            aria-label="Cerrar"
          >
            <X className="h-5 w-5" aria-hidden />
          </button>
        </div>
        <p className="mt-2 text-sm text-muted-foreground">
          Total a cobrar
        </p>
        <p className="text-2xl font-bold text-foreground">
          ${Number(total).toFixed(2)}
        </p>
        <p className="mt-4 text-sm font-medium text-foreground">
          Selecciona el método de pago:
        </p>
        <form onSubmit={handleSubmit} className="mt-3 space-y-3">
          <div className="grid grid-cols-2 gap-2">
            {PAYMENT_METHODS.map(({ id, label, icon: Icon, colorClass }) => {
              const isSelected = selected === id;
              return (
                <button
                  key={id}
                  type="button"
                  onClick={() => setSelected(id)}
                  className={`relative flex min-h-[44px] cursor-pointer flex-col items-center justify-center gap-1 rounded-lg border px-3 py-2.5 text-left transition-colors duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2 ${
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
                  <Icon className={`h-6 w-6 shrink-0 ${colorClass}`} aria-hidden />
                  <span
                    className={`text-xs font-medium ${
                      isSelected ? "text-accent" : "text-muted-foreground"
                    }`}
                  >
                    {label}
                  </span>
                </button>
              );
            })}
          </div>
          <div className="flex gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              disabled={loading}
              className="inline-flex min-h-[44px] flex-1 cursor-pointer items-center justify-center gap-2 rounded-lg border border-border px-4 py-2.5 text-sm font-medium text-muted-foreground transition-colors duration-200 hover:bg-border-soft/60 hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/50 focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
            >
              <X className="h-4 w-4 shrink-0" aria-hidden />
              Cancelar
            </button>
            <button
              type="submit"
              disabled={loading}
              className="inline-flex min-h-[44px] flex-1 cursor-pointer items-center justify-center gap-2 rounded-lg bg-accent px-4 py-2.5 text-sm font-medium text-accent-foreground transition-colors duration-200 hover:bg-accent/90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-70"
            >
              <DollarSign className="h-4 w-4 shrink-0" aria-hidden />
              {loading ? "Guardando…" : "Confirmar cobro"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
