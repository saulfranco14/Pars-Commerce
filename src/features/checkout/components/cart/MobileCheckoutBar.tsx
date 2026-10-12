"use client";

import { ArrowRight } from "lucide-react";

interface MobileCheckoutBarProps {
  subtotal: number;
  accentColor: string;
  onContinue: () => void;
}

export function MobileCheckoutBar({
  subtotal,
  accentColor,
  onContinue,
}: MobileCheckoutBarProps) {
  return (
    <div className="fixed inset-x-3 bottom-[max(0.75rem,env(safe-area-inset-bottom))] z-40 rounded-2xl border border-gray-200 bg-white/95 p-2 shadow-[0_-8px_28px_-10px_rgba(0,0,0,0.2)] backdrop-blur xl:hidden">
      <div className="mx-auto flex w-full max-w-2xl items-center gap-3">
        <div className="min-w-0">
          <p className="text-[11px] font-medium uppercase tracking-wide text-gray-500">
            Subtotal
          </p>
          <p
            className="text-lg font-bold tabular-nums"
            style={{ color: accentColor }}
          >
            ${subtotal.toFixed(2)}
          </p>
        </div>
        <button
          type="button"
          onClick={onContinue}
          className="ml-auto inline-flex min-h-12 flex-1 items-center justify-center gap-2 rounded-2xl px-5 py-3 text-sm font-semibold text-white shadow-sm transition-opacity hover:opacity-90 active:opacity-80 sm:flex-none"
          style={{ backgroundColor: accentColor }}
        >
          Finalizar pedido
          <ArrowRight className="h-4 w-4" aria-hidden />
        </button>
      </div>
    </div>
  );
}
