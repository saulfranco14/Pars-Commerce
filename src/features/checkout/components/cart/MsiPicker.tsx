"use client";

import { calcMsiBuyerTotal, MSI_OPTIONS } from "@/constants/commissionConfig";
import type { MsiOption } from "@/constants/commissionConfig";

import type { PaymentMode } from "@/features/checkout/interfaces/paymentMode";

interface MsiPickerProps {
  paymentMode: PaymentMode;
  msiBaseAmount: number;
  msiOption: MsiOption;
  viableMsiOptions: MsiOption[];
  feeAbsorbedBy: "customer" | "business";
  accentColor: string;
  onSelect: (option: MsiOption) => void;
}

export function MsiPicker({
  paymentMode,
  msiBaseAmount,
  msiOption,
  viableMsiOptions,
  feeAbsorbedBy,
  accentColor,
  onSelect,
}: MsiPickerProps) {
  if (msiBaseAmount <= 0) return null;

  return (
    <div className="space-y-3">
      <div className="flex items-baseline justify-between">
        <p className="text-sm font-semibold text-gray-700">
          Meses sin intereses
        </p>
        {paymentMode === "installments" && (
          <p className="text-[11px] text-gray-500">Aplica al primer abono</p>
        )}
      </div>
      <div className="grid grid-cols-3 gap-2 sm:grid-cols-5">
        {MSI_OPTIONS.map((n) => {
          const isViable = viableMsiOptions.includes(n);
          const breakdown = isViable
            ? calcMsiBuyerTotal(msiBaseAmount, n, feeAbsorbedBy)
            : null;
          const isSelected = msiOption === n;
          return (
            <button
              key={n}
              type="button"
              disabled={!isViable}
              onClick={() => isViable && onSelect(n)}
              className={`flex min-h-[64px] cursor-pointer flex-col items-center justify-center gap-0.5 rounded-xl border-2 px-2 py-2 text-center transition-colors ${
                !isViable
                  ? "cursor-not-allowed border-gray-100 bg-gray-50 text-gray-300"
                  : isSelected
                    ? "border-current bg-current/5"
                    : "border-gray-200 text-gray-600 hover:border-gray-300"
              }`}
              style={
                isSelected && isViable
                  ? { color: accentColor, borderColor: accentColor }
                  : undefined
              }
            >
              <span className="text-xs font-bold leading-tight">
                {n === 1 ? "Contado" : `${n} MSI`}
              </span>
              {breakdown && n > 1 && (
                <span className="text-[10px] tabular-nums opacity-80">
                  ${breakdown.perMonth.toFixed(2)}/mes
                </span>
              )}
              {breakdown && n === 1 && (
                <span className="text-[10px] tabular-nums opacity-80">
                  ${breakdown.total.toFixed(2)}
                </span>
              )}
              {!isViable && <span className="text-[10px]">Min. bajo</span>}
            </button>
          );
        })}
      </div>
    </div>
  );
}
