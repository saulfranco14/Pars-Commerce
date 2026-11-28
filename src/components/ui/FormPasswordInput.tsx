"use client";

import { forwardRef, useState } from "react";
import { Eye, EyeOff } from "lucide-react";

import type { InputHTMLAttributes, ReactNode } from "react";

interface FormPasswordInputProps extends Omit<InputHTMLAttributes<HTMLInputElement>, "size" | "type"> {
  label: string;
  hint?: ReactNode;
  error?: string;
}

/** FormInput's look (DESIGN_SYSTEM.md §5) for passwords, with a show/hide button so it is typed once. */
export const FormPasswordInput = forwardRef<HTMLInputElement, FormPasswordInputProps>(function FormPasswordInput(
  { label, hint, error, className = "", ...props },
  ref,
) {
  const [visible, setVisible] = useState(false);
  return (
    <div className="block">
      <label htmlFor={props.id} className="mb-1.5 block text-[11px] font-bold uppercase tracking-wider text-muted-foreground">
        {label}
      </label>
      <div className="relative">
        <input
          ref={ref}
          {...props}
          type={visible ? "text" : "password"}
          aria-invalid={error ? true : props["aria-invalid"]}
          className={`block w-full rounded-2xl border-2 bg-background py-3 pl-4 pr-14 text-sm font-medium text-foreground placeholder:text-muted-foreground/50 transition-colors focus:outline-none ${
            error ? "border-red-500 focus:border-red-500" : "border-border focus:border-accent"
          } ${className}`}
        />
        <button
          type="button"
          onClick={() => setVisible((current) => !current)}
          aria-label={visible ? "Ocultar contraseña" : "Mostrar contraseña"}
          aria-pressed={visible}
          className="absolute inset-y-0 right-1 flex w-11 cursor-pointer items-center justify-center rounded-xl text-muted-foreground hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/50"
        >
          {visible ? <EyeOff className="h-5 w-5" aria-hidden /> : <Eye className="h-5 w-5" aria-hidden />}
        </button>
      </div>
      {hint && !error ? <p className="mt-1 text-[11px] text-muted-foreground">{hint}</p> : null}
      {error ? <p className="mt-1 text-xs font-medium text-red-600">{error}</p> : null}
    </div>
  );
});
