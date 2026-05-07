"use client";

import { Lock, ShieldCheck, X } from "lucide-react";

import type { PublicCartItem } from "@/services/publicCartService";

import { MobileOrderReview } from "@/features/checkout/components/cart/MobileOrderReview";

interface MobileCheckoutSheetProps {
  visible: boolean;
  items: PublicCartItem[];
  totalUnits: number;
  subtotal: number;
  error: string | null;
  submitting: boolean;
  submitLabel: string;
  submitDisclaimer: string;
  accentColor: string;
  onClose: () => void;
  children: React.ReactNode;
}

export function MobileCheckoutSheet({
  visible,
  items,
  totalUnits,
  subtotal,
  error,
  submitting,
  submitLabel,
  submitDisclaimer,
  accentColor,
  onClose,
  children,
}: MobileCheckoutSheetProps) {
  return (
    <div
      className="fixed inset-0 z-50 xl:hidden"
      role="dialog"
      aria-modal="true"
      aria-labelledby="mobile-checkout-title"
    >
      <div
        className={`absolute inset-0 bg-black/55 backdrop-blur-[2px] transition-opacity duration-200 ${
          visible ? "opacity-100" : "opacity-0"
        }`}
        onClick={onClose}
        aria-hidden
      />
      <div
        className={`absolute inset-x-0 bottom-0 flex max-h-[94vh] flex-col rounded-t-2xl bg-white shadow-2xl transition-transform duration-300 ease-out will-change-transform ${
          visible ? "translate-y-0" : "translate-y-full"
        }`}
      >
        <div className="relative shrink-0 border-b border-gray-100 px-4 pb-3 pt-3">
          <div
            className="mx-auto h-1 w-10 rounded-full bg-gray-300"
            aria-hidden
          />
          <div className="mt-3 flex items-center justify-between gap-3">
            <div className="min-w-0">
              <h2
                id="mobile-checkout-title"
                className="truncate text-base font-semibold text-gray-900"
              >
                Finalizar pedido
              </h2>
              <p className="mt-0.5 truncate text-xs text-gray-500">
                {items.length} {items.length === 1 ? "producto" : "productos"} ·
                ${subtotal.toFixed(2)}
              </p>
            </div>
            <button
              type="button"
              onClick={onClose}
              className="flex h-9 w-9 shrink-0 cursor-pointer items-center justify-center rounded-lg border border-gray-200 bg-white text-gray-600 transition-colors hover:bg-gray-50"
              aria-label="Cerrar"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        </div>

        <div className="min-h-0 flex-1 space-y-5 overflow-y-auto overscroll-contain px-4 py-4">
          {error && (
            <div className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">
              {error}
            </div>
          )}

          <MobileOrderReview items={items} totalUnits={totalUnits} />

          <div className="flex items-center gap-2 rounded-lg border border-gray-100 bg-gray-50/70 px-3 py-2">
            <ShieldCheck className="h-4 w-4 shrink-0 text-gray-500" />
            <p className="text-xs text-gray-600">
              Pago seguro y protegido con Mercado Pago.
            </p>
          </div>
          {children}
        </div>

        <div className="shrink-0 border-t border-gray-100 bg-white/95 px-4 pb-[calc(env(safe-area-inset-bottom)+12px)] pt-3 backdrop-blur">
          <button
            type="submit"
            form="m-checkout-form"
            disabled={submitting}
            className="w-full min-h-[52px] cursor-pointer rounded-xl px-6 py-3.5 text-base font-semibold text-white shadow-sm transition-opacity hover:opacity-90 active:opacity-80 disabled:cursor-not-allowed disabled:opacity-60"
            style={{ backgroundColor: accentColor }}
          >
            {submitLabel}
          </button>
          <div className="mt-2 flex items-center justify-center gap-1.5 text-[11px] text-gray-500">
            <Lock className="h-3 w-3" />
            <span>{submitDisclaimer}</span>
          </div>
        </div>
      </div>
    </div>
  );
}
