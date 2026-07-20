"use client";

import { useState } from "react";
import Image from "next/image";
import { ArrowRight, User } from "lucide-react";

import { Notification } from "@/components/ui/Notification";
import { CustomerScreen } from "@/features/qr/components/customer/CustomerScreen";
import { getInitials } from "@/features/qr/helpers/format";

interface DeviceNamePromptProps {
  tenantName: string;
  tenantLogoUrl?: string | null;
  tableLabel: string;
  onConfirm: (name: string) => Promise<void> | void;
  submitting?: boolean;
  error?: string | null;
}

export function DeviceNamePrompt({
  tenantName,
  tenantLogoUrl,
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

  const header = (
    <div className="flex items-center gap-3">
      <span className="relative flex h-11 w-11 shrink-0 items-center justify-center overflow-hidden rounded-xl bg-white/90 p-1">
        {tenantLogoUrl ? (
          <Image
            src={tenantLogoUrl}
            alt={tenantName}
            fill
            sizes="44px"
            className="object-contain"
          />
        ) : (
          <span className="text-base font-bold uppercase tracking-tight text-accent">
            {getInitials(tenantName?.trim() || tableLabel)}
          </span>
        )}
      </span>
      <div className="min-w-0">
        <p className="text-[10px] font-bold uppercase tracking-wider opacity-75">
          {tenantName}
        </p>
        <p className="truncate text-2xl font-bold tracking-tight">
          {tableLabel}
        </p>
      </div>
    </div>
  );

  return (
    <CustomerScreen
      tenantName={tenantName}
      header={header}
      footer={
        <button
          type="submit"
          form="device-name-form"
          disabled={!isValid || submitting}
          className="flex min-h-[54px] w-full cursor-pointer items-center justify-center gap-2 rounded-2xl bg-accent px-4 text-base font-bold text-accent-foreground shadow-md shadow-accent/20 transition-all hover:bg-accent/90 active:scale-[0.99] disabled:cursor-not-allowed disabled:opacity-50"
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
      }
    >
      <div className="mb-5">
        <h2 className="text-xl font-bold text-foreground">¿Cómo te llamas?</h2>
        <p className="mt-1 text-sm text-muted-foreground">
          Para que el personal te identifique al atenderte y sepas qué pediste
          tú en la cuenta.
        </p>
      </div>

      <form id="device-name-form" onSubmit={handleSubmit} className="space-y-4">
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
              className="block w-full rounded-2xl border-2 border-border bg-background py-3.5 pl-11 pr-4 text-base font-medium text-foreground placeholder:text-muted-foreground/50 transition-colors focus:border-accent focus:outline-none"
            />
          </div>
        </label>

        {error && <Notification tone="error" message={error} />}

        <p className="text-xs text-muted-foreground">
          Solo se usa para identificarte en esta mesa.
        </p>
      </form>
    </CustomerScreen>
  );
}
