"use client";

interface InstallmentsPickerProps {
  options: number[];
  selected: number;
  subtotal: number;
  onSelect: (value: number) => void;
  accentColor: string;
}

export function InstallmentsPicker({
  options,
  selected,
  subtotal,
  onSelect,
  accentColor,
}: InstallmentsPickerProps) {
  if (options.length === 0) return null;

  return (
    <div className="space-y-3 rounded-xl border border-gray-100 bg-gray-50/50 p-4">
      <p className="text-xs font-medium text-gray-600">
        Divide tu compra en abonos:
      </p>
      <div className="flex flex-wrap gap-2">
        {options.map((n) => {
          const perPayment = Math.round((subtotal / n) * 100) / 100;
          const isActive = selected === n;
          return (
            <button
              key={n}
              type="button"
              onClick={() => onSelect(n)}
              className={`min-h-[40px] cursor-pointer rounded-lg border-2 px-3 py-1.5 text-xs font-semibold tabular-nums transition-colors ${
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
              {n}x ${perPayment.toFixed(2)}
            </button>
          );
        })}
      </div>
    </div>
  );
}
