"use client";

import { RefreshCw } from "lucide-react";

import { generateStaffPassword, STAFF_PASSWORD_MIN_LENGTH } from "@/lib/auth/staffPassword";

/** Visible on purpose: the owner chooses it to hand it over. */
export function StaffPasswordInput({
  id,
  value,
  onChange,
  error,
}: {
  id: string;
  value: string;
  onChange: (value: string) => void;
  error?: string | null;
}) {
  return (
    <div>
      <label htmlFor={id} className="mb-1.5 block text-[11px] font-bold uppercase tracking-wider text-muted-foreground">
        Contraseña
      </label>
      <div className="flex gap-2">
        <input
          id={id}
          type="text"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          autoComplete="new-password"
          autoCapitalize="none"
          autoCorrect="off"
          spellCheck={false}
          placeholder={`Mínimo ${STAFF_PASSWORD_MIN_LENGTH} caracteres`}
          aria-invalid={Boolean(error)}
          className={`input-form min-h-11 min-w-0 flex-1 rounded-xl border px-3 py-2.5 font-mono text-base text-foreground placeholder:font-sans placeholder:text-muted focus:outline-none focus:ring-2 ${
            error ? "border-red-400 focus:ring-red-400/20" : "focus:border-accent focus:ring-accent/20"
          }`}
        />
        <button
          type="button"
          onClick={() => onChange(generateStaffPassword())}
          className="inline-flex min-h-11 shrink-0 cursor-pointer items-center gap-1.5 rounded-xl border border-border px-3 text-sm font-semibold text-foreground transition-colors hover:bg-border-soft"
        >
          <RefreshCw className="h-4 w-4" aria-hidden />
          Generar
        </button>
      </div>
      {error && <p className="mt-1.5 text-xs text-red-600 dark:text-red-400">{error}</p>}
    </div>
  );
}
