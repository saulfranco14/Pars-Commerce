"use client";

import { Check } from "lucide-react";

import type { TenantPaymentMethod } from "@/features/configuracion/interfaces/bankAccount";

interface BankAccountCardProps {
  account: TenantPaymentMethod;
  isSelected: boolean;
  onSelect: (id: string) => void;
  onEdit: (account: TenantPaymentMethod) => void;
  onDelete: (id: string) => void;
  activating: boolean;
  deleting: boolean;
}

export function BankAccountCard({
  account,
  isSelected,
  onSelect,
  onEdit,
  onDelete,
  activating,
  deleting,
}: BankAccountCardProps) {
  function handleCardClick() {
    if (!isSelected && !activating) onSelect(account.id);
  }

  function handleCardKey(e: React.KeyboardEvent) {
    if ((e.key === "Enter" || e.key === " ") && !isSelected && !activating) {
      e.preventDefault();
      onSelect(account.id);
    }
  }

  return (
    <article
      role="radio"
      aria-checked={isSelected}
      tabIndex={isSelected ? -1 : 0}
      onClick={handleCardClick}
      onKeyDown={handleCardKey}
      className={`group relative rounded-xl border bg-surface p-4 space-y-3 transition-all duration-200
        ${isSelected
          ? "border-accent ring-2 ring-accent/20 shadow-sm"
          : "border-border hover:border-accent/40 hover:bg-border-soft/20 cursor-pointer"}
        ${activating ? "opacity-70" : ""}
      `}
    >
      <div className="flex items-start gap-3">
        {/* Radio indicator */}
        <div
          aria-hidden
          className={`mt-0.5 shrink-0 flex h-5 w-5 items-center justify-center rounded-full border-2 transition-all duration-200
            ${isSelected
              ? "border-accent bg-accent scale-110"
              : "border-border bg-transparent group-hover:border-accent/60"}
          `}
        >
          {isSelected && <Check className="h-3 w-3 text-accent-foreground" strokeWidth={3} />}
          {!isSelected && activating && (
            <span className="block h-2 w-2 rounded-full bg-accent animate-pulse" />
          )}
        </div>

        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2">
            <h3 className="text-sm font-semibold text-foreground truncate">
              {account.label ?? "Cuenta sin nombre"}
            </h3>
            {isSelected && (
              <span className="shrink-0 rounded-full bg-accent px-2 py-0.5 text-xs font-semibold text-accent-foreground">
                Principal
              </span>
            )}
          </div>
          <p className="mt-0.5 text-xs text-muted-foreground">
            {account.bank_name} · {account.account_holder}
          </p>
          <p className="mt-1 font-mono text-sm text-foreground">
            {account.clabe ?? "Sin CLABE"}
          </p>
        </div>
      </div>

      {/* Actions — stop propagation so clicks don't trigger card select */}
      <div className="flex flex-wrap items-center gap-2 pl-8" onClick={(e) => e.stopPropagation()}>
        <button
          type="button"
          onClick={() => onEdit(account)}
          className="min-h-[36px] cursor-pointer rounded-lg border border-border bg-surface px-3 py-1.5 text-xs font-medium text-foreground hover:bg-border-soft/40"
        >
          Editar
        </button>
        <button
          type="button"
          onClick={() => onDelete(account.id)}
          disabled={deleting || isSelected}
          title={isSelected ? "No puedes eliminar la cuenta principal" : undefined}
          className="min-h-[36px] cursor-pointer rounded-lg border border-red-200 bg-surface px-3 py-1.5 text-xs font-medium text-red-600 hover:bg-red-50 disabled:opacity-40 disabled:cursor-not-allowed"
        >
          {deleting ? "Eliminando..." : "Eliminar"}
        </button>
      </div>
    </article>
  );
}
