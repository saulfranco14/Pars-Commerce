"use client";

import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { Check } from "lucide-react";

import { formatCurrency } from "@/features/qr/helpers/format";
import {
  PAYMENT_METHOD_META,
  PAYMENT_METHOD_ORDER,
} from "@/features/qr/constants/paymentMethodMeta";

export type CustomerPayMethod =
  | "efectivo"
  | "transferencia"
  | "tarjeta"
  | "mercadopago";

interface CustomerPayModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (method: CustomerPayMethod) => Promise<void> | void;
  total: number;
  loading?: boolean;
  description?: string;
}

export function CustomerPayModal({
  isOpen,
  onClose,
  onConfirm,
  total,
  loading = false,
  description,
}: CustomerPayModalProps) {
  const [mounted, setMounted] = useState(false);
  const [selected, setSelected] = useState<CustomerPayMethod>("mercadopago");

  useEffect(() => setMounted(true), []);
  useEffect(() => {
    if (isOpen) setSelected("mercadopago");
  }, [isOpen]);
  useEffect(() => {
    if (!isOpen) return;
    const original = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape" && !loading) onClose();
    }
    document.addEventListener("keydown", onKey);
    return () => {
      document.body.style.overflow = original;
      document.removeEventListener("keydown", onKey);
    };
  }, [isOpen, onClose, loading]);

  if (!mounted || !isOpen) return null;

  async function handleConfirm() {
    if (loading) return;
    await onConfirm(selected);
  }

  return createPortal(
    <div
      className="fixed inset-0 z-50 flex flex-col justify-end bg-black/60 md:items-center md:justify-center md:p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="customer-pay-title"
      onClick={onClose}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="flex max-h-[92vh] w-full max-w-md flex-col overflow-hidden rounded-t-3xl border-t border-border-soft bg-surface shadow-2xl md:max-h-none md:rounded-3xl md:border"
        style={{ paddingBottom: "max(0.75rem, env(safe-area-inset-bottom))" }}
      >
        {/* Grabber */}
        <div className="flex shrink-0 justify-center pt-3 md:hidden">
          <div
            className="h-1 w-12 rounded-full bg-muted-foreground/30"
            aria-hidden
          />
        </div>

        {/* Header — accent band with amount */}
        <div className="shrink-0 px-5 pb-5 pt-4 md:px-6 md:pt-6">
          <h2
            id="customer-pay-title"
            className="text-base font-semibold uppercase tracking-wider text-muted-foreground"
          >
            Pagar mi cuenta
          </h2>
          <p className="mt-0.5 text-4xl font-bold tracking-tight text-foreground">
            {formatCurrency(total)}
          </p>
          {description && (
            <p className="mt-1 text-xs text-muted-foreground">{description}</p>
          )}
        </div>

        {/* Divider */}
        <div className="mx-5 mb-3 border-t border-border-soft md:mx-6" />

        {/* Method list */}
        <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain px-5 pb-2 md:px-6">
          <p className="mb-3 text-sm font-bold text-foreground">
            ¿Cómo quieres pagar?
          </p>
          <div className="space-y-2">
            {PAYMENT_METHOD_ORDER.map((id) => {
              const meta = PAYMENT_METHOD_META[id];
              const Icon = meta.icon;
              const isSelected = selected === id;
              return (
                <button
                  key={id}
                  type="button"
                  onClick={() => setSelected(id)}
                  aria-pressed={isSelected}
                  className={`relative flex w-full min-h-[68px] cursor-pointer items-center gap-3 rounded-2xl border-2 px-4 py-3.5 text-left transition-all duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2 ${
                    isSelected
                      ? "border-accent bg-accent/5 shadow-sm"
                      : "border-border bg-surface hover:bg-border-soft/40"
                  }`}
                >
                  <span
                    className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-xl ${
                      isSelected ? meta.bg : "bg-border-soft/60"
                    }`}
                  >
                    <Icon
                      className={`h-5 w-5 ${isSelected ? meta.color : "text-muted-foreground"}`}
                      aria-hidden
                    />
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="block text-sm font-bold text-foreground">
                      {meta.pickerLabel}
                    </span>
                    <span className="block truncate text-xs text-muted-foreground">
                      {meta.description}
                    </span>
                  </span>
                  {isSelected && (
                    <span
                      className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-accent text-accent-foreground"
                      aria-hidden
                    >
                      <Check className="h-3.5 w-3.5" />
                    </span>
                  )}
                </button>
              );
            })}
          </div>
        </div>

        {/* Footer */}
        <div className="shrink-0 px-5 pb-3 pt-4 md:px-6 md:pb-6">
          <div className="flex flex-col-reverse gap-2 md:flex-row md:items-center md:justify-end md:gap-3">
            <button
              type="button"
              onClick={onClose}
              disabled={loading}
              className="flex min-h-[48px] w-full cursor-pointer items-center justify-center rounded-2xl border border-border bg-surface px-4 py-3 text-sm font-medium text-foreground hover:bg-border-soft/60 disabled:cursor-not-allowed disabled:opacity-50 md:max-w-[130px]"
            >
              Cancelar
            </button>
            <button
              type="button"
              onClick={handleConfirm}
              disabled={loading}
              className="flex min-h-[52px] w-full cursor-pointer items-center justify-center gap-2 rounded-2xl bg-accent px-4 py-3 text-base font-bold text-accent-foreground shadow-md shadow-accent/20 hover:bg-accent/90 active:scale-[0.99] disabled:cursor-not-allowed disabled:opacity-70 transition-all md:max-w-[220px]"
            >
              {loading ? "Procesando..." : `Pagar ${formatCurrency(total)}`}
            </button>
          </div>
        </div>
      </div>
    </div>,
    document.body,
  );
}
