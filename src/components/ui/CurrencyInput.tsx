"use client";

import type { InputHTMLAttributes } from "react";

type CurrencyInputProps = Omit<
  InputHTMLAttributes<HTMLInputElement>,
  "type" | "value" | "onChange"
> & {
  value: string;
  onValueChange: (value: string) => void;
};

/**
 * Monetary inputs must not use `type=number`: mobile browsers expose spinner
 * controls and make it too easy to submit an invalid decimal. This field keeps
 * a plain, touch-friendly decimal keyboard while Tlaco owns the MXN context.
 */
export function CurrencyInput({
  value,
  onValueChange,
  className = "",
  ...props
}: CurrencyInputProps) {
  return (
    <div className="flex min-h-12 items-center overflow-hidden rounded-xl border border-border bg-surface transition-colors focus-within:border-accent focus-within:ring-2 focus-within:ring-accent/20">
      <span className="shrink-0 border-r border-border-soft px-3 text-sm font-bold text-muted-foreground">
        MX$
      </span>
      <input
        {...props}
        type="text"
        inputMode="decimal"
        autoComplete="off"
        value={value}
        onChange={(event) => {
          const clean = event.target.value
            .replace(/[^0-9.]/g, "")
            .replace(/(\..*)\./g, "$1");
          const [whole = "", decimal] = clean.split(".");
          onValueChange(
            decimal === undefined ? whole : `${whole}.${decimal.slice(0, 2)}`,
          );
        }}
        className={`min-w-0 flex-1 bg-transparent px-3 py-3 text-base font-semibold tabular-nums text-foreground outline-none placeholder:font-normal placeholder:text-muted ${className}`}
      />
    </div>
  );
}
