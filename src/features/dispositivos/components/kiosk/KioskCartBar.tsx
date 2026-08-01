"use client";

import { ChevronDown, ChevronUp, ShoppingBag } from "lucide-react";

import { formatCurrency } from "@/features/qr/helpers/format";

interface KioskCartBarProps {
  itemCount: number;
  total: number;
  expanded: boolean;
  onToggle: () => void;
}

/**
 * Barra del pedido para pantalla vertical. Siempre a la vista y al alcance del
 * pulgar; el cajón con el detalle sube desde aquí.
 */
export function KioskCartBar({
  itemCount,
  total,
  expanded,
  onToggle,
}: KioskCartBarProps) {
  const empty = itemCount === 0;
  const Chevron = expanded ? ChevronDown : ChevronUp;

  if (empty) {
    return (
      <div className="flex min-h-20 items-center justify-center border-t border-border bg-surface px-6">
        <p className="text-lg text-muted-foreground">
          Toca un producto para empezar
        </p>
      </div>
    );
  }

  return (
    <button
      type="button"
      onClick={onToggle}
      aria-expanded={expanded}
      className="flex min-h-24 w-full cursor-pointer items-center justify-between gap-4 border-t border-border bg-surface px-6 text-left transition-colors hover:bg-border-soft/40"
    >
      <span className="flex items-center gap-4">
        <span className="relative flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-accent/10">
          <ShoppingBag className="h-7 w-7 text-accent" aria-hidden />
          <span className="absolute -right-1.5 -top-1.5 flex h-7 min-w-7 items-center justify-center rounded-full bg-accent px-1.5 text-sm font-bold text-accent-foreground">
            {itemCount}
          </span>
        </span>
        <span>
          <span className="block text-sm font-bold uppercase tracking-wider text-muted-foreground">
            Tu pedido
          </span>
          <span className="block text-3xl font-bold tracking-tight tabular-nums text-foreground">
            {formatCurrency(total)}
          </span>
        </span>
      </span>

      <span className="inline-flex min-h-16 items-center gap-2 rounded-2xl bg-accent px-8 text-xl font-bold text-accent-foreground shadow-lg shadow-accent/25">
        {expanded ? "Ocultar" : "Ver pedido"}
        <Chevron className="h-6 w-6 shrink-0" aria-hidden />
      </span>
    </button>
  );
}
