"use client";
import { Check } from "lucide-react";
import type { StudioOptionsProps } from "../interfaces/ui";
export function StudioOptions<T extends string>({
  label,
  value,
  options,
  onChange,
  disabled,
}: StudioOptionsProps<T>) {
  return (
    <fieldset disabled={disabled}>
      <legend className="mb-2 text-xs font-semibold text-muted-foreground">
        {label}
      </legend>
      <div className="flex flex-wrap gap-2">
        {options.map((o) => (
          <button
            key={o.value}
            type="button"
            aria-pressed={value === o.value}
            onClick={() => onChange(o.value)}
            className={`inline-flex min-h-11 items-center gap-2 rounded-xl border px-3 py-2 text-sm font-medium disabled:opacity-50 ${value === o.value ? "border-accent bg-accent/10 text-accent" : "border-border bg-surface"}`}
          >
            {value === o.value && <Check className="h-4 w-4" aria-hidden />}
            {o.label}
          </button>
        ))}
      </div>
    </fieldset>
  );
}
