"use client";

import { useState } from "react";
import { ArrowRight, User } from "lucide-react";

import { CustomerScreenLayout } from "@/features/qr/components/CustomerScreenLayout";

interface DeviceNamePromptProps {
  tenantName: string;
  tableLabel: string;
  onConfirm: (name: string) => Promise<void> | void;
  submitting?: boolean;
  error?: string | null;
}

export function DeviceNamePrompt({
  tenantName,
  tableLabel,
  onConfirm,
  submitting = false,
  error,
}: DeviceNamePromptProps) {
  const [name, setName] = useState("");
  const trimmed = name.trim();
  const isValid = trimmed.length >= 2 && trimmed.length <= 40;

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!isValid || submitting) return;
    await onConfirm(trimmed);
  }

  const hero = (
    <div className="text-center">
      <h1 className="text-4xl font-bold tracking-tight lg:text-5xl">
        {tableLabel}
      </h1>
      <p className="mt-3 text-base font-medium opacity-90">
        Pide y paga directo desde tu celular.
      </p>
    </div>
  );

  return (
    <CustomerScreenLayout hero={hero} tenantName={tenantName}>
      <div className="mb-5 flex flex-col items-center text-center">
        <div className="flex h-14 w-14 items-center justify-center rounded-full bg-accent/10">
          <User className="h-7 w-7 text-accent" />
        </div>
        <h2 className="mt-3 text-xl font-bold text-foreground">
          ¿Cómo te llamas?
        </h2>
        <p className="mt-1 text-sm text-muted-foreground">
          Para que el personal te identifique al atenderte.
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        <label className="block">
          <span className="mb-1.5 block text-[11px] font-bold uppercase tracking-wider text-muted-foreground">
            Tu nombre
          </span>
          <div className="relative">
            <User className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <input
              type="text"
              autoFocus
              autoComplete="given-name"
              maxLength={40}
              placeholder="Ej. María"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="block w-full rounded-2xl border-2 border-border bg-background py-3.5 pl-11 pr-4 text-base font-medium text-foreground placeholder:text-muted-foreground/50 focus:border-accent focus:outline-none transition-colors"
            />
          </div>
        </label>

        {error && (
          <p className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
            {error}
          </p>
        )}

        <button
          type="submit"
          disabled={!isValid || submitting}
          className="flex min-h-[56px] w-full cursor-pointer items-center justify-center gap-2 rounded-2xl bg-accent px-4 py-3 text-base font-bold text-accent-foreground shadow-md shadow-accent/20 hover:bg-accent/90 active:scale-[0.99] disabled:cursor-not-allowed disabled:opacity-50 transition-all"
        >
          {submitting ? (
            <span className="animate-pulse">Entrando...</span>
          ) : (
            <>
              Entrar
              <ArrowRight className="h-5 w-5" />
            </>
          )}
        </button>

        <p className="text-center text-xs text-muted-foreground">
          Solo se usa para identificarte en esta mesa.
        </p>
      </form>
    </CustomerScreenLayout>
  );
}
