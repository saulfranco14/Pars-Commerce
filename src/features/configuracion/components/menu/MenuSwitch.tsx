"use client";

import type { MenuSwitchProps } from "@/features/configuracion/interfaces/menuEditor";

/** The menu editor's on/off control; `partial` reads as "some entries of this module are hidden". */
export function MenuSwitch({ checked, partial = false, disabled = false, label, onChange, size = "md" }: MenuSwitchProps) {
  const track = size === "lg" ? "h-7 w-12" : "h-6 w-10";
  const knob = size === "lg" ? "h-6 w-6" : "h-5 w-5";
  const onShift = size === "lg" ? "translate-x-5.5" : "translate-x-4.5";

  return (
    <label className={`inline-flex min-h-11 min-w-12 shrink-0 items-center justify-center ${disabled ? "cursor-not-allowed" : "cursor-pointer"}`}>
      <input
        type="checkbox"
        role="switch"
        checked={checked}
        aria-checked={partial ? "mixed" : checked}
        disabled={disabled}
        onChange={onChange}
        aria-label={label}
        className="peer sr-only"
      />
      <span
        aria-hidden
        className={`relative ${track} rounded-full transition-colors peer-focus-visible:ring-2 peer-focus-visible:ring-accent peer-focus-visible:ring-offset-2 ${
          checked ? (partial ? "bg-accent/50" : "bg-accent") : "bg-border"
        }`}
      >
        <span
          className={`absolute top-0.5 ${knob} rounded-full bg-white shadow transition-transform ${checked ? onShift : "translate-x-0.5"}`}
        />
      </span>
    </label>
  );
}
