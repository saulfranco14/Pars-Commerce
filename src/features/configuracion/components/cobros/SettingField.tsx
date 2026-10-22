"use client";

import type { SettingFieldProps } from "@/features/configuracion/interfaces/paymentsAndDelivery";

export function SettingField({ label, value, onChange, placeholder, inputMode }: SettingFieldProps) {
  return (
    <label className="block text-sm font-semibold text-foreground">
      {label}
      <input
        value={value}
        onChange={(event) => onChange(event.target.value)}
        placeholder={placeholder}
        inputMode={inputMode}
        className="mt-1.5 min-h-11 w-full rounded-xl border border-border bg-background px-3 text-sm font-normal outline-none transition focus:border-accent focus:ring-2 focus:ring-accent/15"
      />
    </label>
  );
}
