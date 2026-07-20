"use client";

import { useState } from "react";
import { Calendar, Check, ChevronDown } from "lucide-react";

import { FormSheet } from "@/components/ui/FormSheet";

export interface PeriodOption {
  value: string;
  label: string;
  disabled?: boolean;
}

interface PeriodSelectorProps {
  value: string;
  options: PeriodOption[];
  onChange: (value: string) => void;
  /** Trigger label; defaults to the active option's label. */
  label?: string;
}

/**
 * Period picker homologated with the date-filter pattern: a pill trigger that
 * opens a bottom sheet with the choices as full-width rows (not a native
 * `<select>`, which reads as a different, lower-effort control next to the
 * accent CTA). Same trigger shape works at every breakpoint — no separate
 * desktop-only variant needed.
 */
export function PeriodSelector({
  value,
  options,
  onChange,
  label,
}: PeriodSelectorProps) {
  const [open, setOpen] = useState(false);
  const active = options.find((o) => o.value === value);
  const triggerLabel = label ?? active?.label ?? "Periodo";

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="flex min-h-[44px] w-full items-center justify-between gap-2 rounded-2xl border border-border bg-background px-4 text-sm font-bold text-foreground transition-colors hover:bg-border-soft/40"
      >
        <span className="flex items-center gap-2 truncate">
          <Calendar className="h-4 w-4 shrink-0 text-muted-foreground" />
          {triggerLabel}
        </span>
        <ChevronDown className="h-4 w-4 shrink-0 text-muted-foreground" />
      </button>

      <FormSheet
        isOpen={open}
        onClose={() => setOpen(false)}
        title="Periodo"
        maxWidth="max-w-md"
      >
        <div className="space-y-1.5">
          {options.map((opt) => {
            const isActive = opt.value === value;
            return (
              <button
                key={opt.value}
                type="button"
                disabled={opt.disabled}
                onClick={() => {
                  onChange(opt.value);
                  setOpen(false);
                }}
                className={`flex min-h-[52px] w-full items-center justify-between rounded-2xl px-4 text-left text-base font-medium transition-colors disabled:cursor-not-allowed disabled:opacity-50 ${
                  isActive
                    ? "bg-accent/15 text-accent"
                    : "text-foreground hover:bg-border-soft/60"
                }`}
              >
                {opt.label}
                {isActive && <Check className="h-4 w-4 shrink-0" />}
              </button>
            );
          })}
        </div>
      </FormSheet>
    </>
  );
}
