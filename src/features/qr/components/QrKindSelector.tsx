"use client";

import { Coffee, CreditCard } from "lucide-react";

interface QrKindSelectorProps {
  value: "payment" | "table";
  onChange: (value: "payment" | "table") => void;
  disabled?: boolean;
}

const options = [
  {
    value: "table" as const,
    label: "Mesa",
    description: "Para que tus clientes vean los productos y hagan su pedido desde la mesa.",
    Icon: Coffee,
  },
  {
    value: "payment" as const,
    label: "Cobro libre",
    description: "Para recibir un pago con monto ingresado o fijo.",
    Icon: CreditCard,
  },
];

export function QrKindSelector({ value, onChange, disabled }: QrKindSelectorProps) {
  return (
    <div role="radiogroup" aria-label="Tipo de QR" className="grid grid-cols-1 gap-3 sm:grid-cols-2">
      {options.map(({ value: optionValue, label, description, Icon }) => {
        const isSelected = value === optionValue;
        return (
          <button
            key={optionValue}
            type="button"
            role="radio"
            aria-checked={isSelected}
            disabled={disabled}
            onClick={() => onChange(optionValue)}
            className={`group flex w-full cursor-pointer flex-col items-start gap-2 rounded-xl border-2 p-4 text-left transition-all duration-200 disabled:cursor-not-allowed disabled:opacity-60
              ${isSelected
                ? "border-accent bg-accent/5 ring-2 ring-accent/20"
                : "border-border bg-surface hover:border-accent/40 hover:bg-border-soft/20"}
            `}
          >
            <div className="flex items-center gap-2">
              <span
                className={`flex h-9 w-9 items-center justify-center rounded-lg transition-colors
                  ${isSelected ? "bg-accent text-accent-foreground" : "bg-border-soft text-muted-foreground group-hover:bg-accent/10 group-hover:text-accent"}
                `}
              >
                <Icon className="h-5 w-5" />
              </span>
              <span className="text-base font-semibold text-foreground">{label}</span>
            </div>
            <p className="text-xs text-muted-foreground">{description}</p>
          </button>
        );
      })}
    </div>
  );
}
