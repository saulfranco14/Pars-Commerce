"use client";

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
    <div className="fixed inset-x-0 bottom-0 z-40 border-t border-gray-200 bg-white/95 px-4 pb-[calc(env(safe-area-inset-bottom)+12px)] pt-3 shadow-[0_-8px_24px_-12px_rgba(0,0,0,0.15)] backdrop-blur xl:hidden">
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
          className="ml-auto inline-flex min-h-[48px] flex-1 items-center justify-center gap-2 rounded-xl px-5 py-3 text-sm font-semibold text-white shadow-sm transition-opacity hover:opacity-90 active:opacity-80 sm:flex-none"
          style={{ backgroundColor: accentColor }}
        >
          Continuar al pago
        </button>
      </div>
    </div>
  );
}
