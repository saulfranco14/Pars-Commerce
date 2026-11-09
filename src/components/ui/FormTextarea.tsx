"use client";
import { forwardRef } from "react";
import type { TextareaHTMLAttributes } from "react";

interface FormTextareaProps
  extends TextareaHTMLAttributes<HTMLTextAreaElement> {
  label: string;
  hint?: string;
  error?: string;
}
export const FormTextarea = forwardRef<HTMLTextAreaElement, FormTextareaProps>(
  function FormTextarea({ label, hint, error, className = "", ...props }, ref) {
    return (
      <label className="block">
        <span className="mb-1.5 block text-[11px] font-bold uppercase tracking-wider text-muted-foreground">
          {label}
        </span>
        <textarea
          ref={ref}
          rows={4}
          aria-invalid={Boolean(error)}
          {...props}
          className={`block min-h-28 w-full resize-y rounded-2xl border-2 bg-background px-3 py-3 text-sm text-foreground outline-none focus:border-accent focus:ring-2 focus:ring-accent/20 disabled:opacity-60 ${error ? "border-red-400" : "border-border"} ${className}`}
        />
        {hint && (
          <span className="mt-1 block text-xs text-muted-foreground">
            {hint}
          </span>
        )}
        {error && (
          <span className="mt-1 block text-xs text-red-600">{error}</span>
        )}
      </label>
    );
  },
);
