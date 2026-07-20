"use client";

import { forwardRef } from "react";
import type { InputHTMLAttributes, ReactNode } from "react";
import type { LucideIcon } from "lucide-react";

interface FormInputProps
  extends Omit<InputHTMLAttributes<HTMLInputElement>, "size"> {
  label: string;
  hint?: ReactNode;
  error?: string;
  icon?: LucideIcon;
  optional?: boolean;
}

/**
 * Canonical input pattern per DESIGN_SYSTEM.md §5:
 *  - uppercase bold eyebrow label above
 *  - rounded-2xl border-2 input
 *  - leading icon
 *  - inline error message below
 *
 * Replaces ad-hoc `<label><input className="rounded-lg ..." /></label>`
 * blocks duplicated around dashboard forms. Use this for any text/number/
 * email input inside a form.
 */
export const FormInput = forwardRef<HTMLInputElement, FormInputProps>(
  function FormInput(
    { label, hint, error, icon: Icon, optional, className = "", ...props },
    ref,
  ) {
    return (
      <label className="block">
        <span className="mb-1.5 block text-[11px] font-bold uppercase tracking-wider text-muted-foreground">
          {label}
          {optional && (
            <span className="ml-1 font-medium normal-case text-muted-foreground/60">
              (opcional)
            </span>
          )}
        </span>
        <div className="relative">
          {Icon && (
            <Icon
              className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground"
              aria-hidden
            />
          )}
          <input
            ref={ref}
            {...props}
            className={`block w-full rounded-2xl border-2 border-border bg-background py-3 text-sm font-medium text-foreground placeholder:text-muted-foreground/50 focus:border-accent focus:outline-none transition-colors ${
              Icon ? "pl-10 pr-3" : "px-4"
            } ${className}`}
          />
        </div>
        {hint && !error && (
          <p className="mt-1 text-[11px] text-muted-foreground">{hint}</p>
        )}
        {error && (
          <p className="mt-1 text-xs font-medium text-red-600">{error}</p>
        )}
      </label>
    );
  },
);
