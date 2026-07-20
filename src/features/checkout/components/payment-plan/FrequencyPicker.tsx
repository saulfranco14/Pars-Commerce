"use client";

import {
  freqLabel,
  type CartFrequency,
} from "@/features/checkout/helpers/cartFrequency";
import type { PaymentMode } from "@/features/checkout/interfaces/paymentMode";

interface FrequencyPickerProps {
  paymentMode: PaymentMode;
  frequencies: CartFrequency[];
  selected: CartFrequency;
  onSelect: (value: CartFrequency) => void;
  accentColor: string;
}

export function FrequencyPicker({
  paymentMode,
  frequencies,
  selected,
  onSelect,
  accentColor,
}: FrequencyPickerProps) {
  return (
    <div className="space-y-2">
      <p className="text-xs font-medium text-gray-600">
        {paymentMode === "recurring"
          ? "Recibe tus productos cada:"
          : "Frecuencia de cobro:"}
      </p>
      <div className="flex gap-2">
        {frequencies.map((freq) => {
          const isActive = selected === freq;
          return (
            <button
              key={freq}
              type="button"
              onClick={() => onSelect(freq)}
              className={`min-h-[40px] flex-1 cursor-pointer rounded-lg border-2 px-3 py-1.5 text-xs font-semibold transition-colors ${
                isActive
                  ? "border-current bg-current/5"
                  : "border-gray-200 text-gray-600 hover:border-gray-300"
              }`}
              style={
                isActive
                  ? { color: accentColor, borderColor: accentColor }
                  : undefined
              }
            >
              {freqLabel(freq)}
            </button>
          );
        })}
      </div>
    </div>
  );
}
