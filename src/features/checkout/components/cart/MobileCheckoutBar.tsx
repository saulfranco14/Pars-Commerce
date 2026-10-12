"use client";

import { ArrowRight } from "lucide-react";
import { MobileActionBar } from "@/components/layout/MobileActionBar";

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
    <MobileActionBar className="xl:hidden" contentClassName="max-w-2xl">
      <div className="mx-auto w-full max-w-2xl space-y-3">
        <div className="flex items-end justify-between gap-3">
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
          className="inline-flex min-h-13 w-full items-center justify-center gap-2 rounded-2xl px-5 py-3 text-sm font-bold text-white shadow-sm transition-opacity hover:opacity-90 active:opacity-80"
          style={{ backgroundColor: accentColor }}
        >
          Finalizar pedido
          <ArrowRight className="h-4 w-4" aria-hidden />
        </button>
      </div>
    </MobileActionBar>
  );
}
