"use client";

import { useState } from "react";
import { ChevronDown, Loader2, Minus, Plus, ShoppingBag } from "lucide-react";

import { formatCurrency } from "@/features/qr/helpers/format";

import type { StaffOrderCartPanelProps } from "@/features/qr/interfaces/staffOrderCart";

/**
 * Bottom cart for staff order-taking. It starts compact so the product catalog
 * remains the work surface; tapping its summary expands the editable lines.
 */
export function StaffOrderCartPanel({
  lines,
  total,
  itemCount,
  onAdd,
  onDecrement,
  onSubmit,
  submitting,
  error,
  appendingToTable,
}: StaffOrderCartPanelProps) {
  const [expanded, setExpanded] = useState(false);

  if (itemCount === 0) {
    return (
      <div className="flex min-h-12 items-center justify-center gap-2 rounded-2xl border border-border bg-surface px-4 text-sm text-muted-foreground">
        <ShoppingBag className="h-4 w-4 shrink-0" aria-hidden />
        Toca un producto para empezar el pedido
      </div>
    );
  }

  return (
    <div className="rounded-2xl border border-border bg-surface p-2 shadow-lg shadow-foreground/5">
      {expanded && (
        <div className="space-y-2 px-2 pb-2 pt-1">
          <ul className="max-h-36 space-y-1 overflow-y-auto sm:max-h-52">
            {lines.map((line) => (
              <li
                key={line.product.id}
                className="flex items-center gap-3 rounded-xl bg-border-soft/30 px-3 py-2"
              >
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-semibold text-foreground">
                    {line.product.name}
                  </p>
                  <p className="text-xs text-muted-foreground tabular-nums">
                    {formatCurrency(Number(line.product.price))} c/u
                  </p>
                </div>
                <div className="flex shrink-0 items-center gap-1 rounded-full border border-border bg-surface p-0.5">
                  <button
                    type="button"
                    onClick={() => onDecrement(line.product.id)}
                    aria-label={`Quitar uno de ${line.product.name}`}
                    className="flex h-10 w-10 items-center justify-center rounded-full text-accent transition-transform hover:bg-accent/10 active:scale-90"
                  >
                    <Minus className="h-4 w-4" strokeWidth={2.75} aria-hidden />
                  </button>
                  <span className="min-w-5 text-center text-sm font-bold tabular-nums text-foreground">
                    {line.quantity}
                  </span>
                  <button
                    type="button"
                    onClick={() => onAdd(line.product.id)}
                    aria-label={`Agregar uno más de ${line.product.name}`}
                    className="flex h-10 w-10 items-center justify-center rounded-full bg-accent text-accent-foreground transition-transform hover:bg-accent/90 active:scale-90"
                  >
                    <Plus className="h-4 w-4" strokeWidth={2.75} aria-hidden />
                  </button>
                </div>
                <span className="w-16 shrink-0 text-right text-sm font-bold tabular-nums text-foreground">
                  {formatCurrency(Number(line.product.price) * line.quantity)}
                </span>
              </li>
            ))}
          </ul>
          {error && (
            <p className="text-sm font-medium text-red-600" role="alert">
              {error}
            </p>
          )}
        </div>
      )}

      <button
        type="button"
        onClick={() => setExpanded((current) => !current)}
        aria-expanded={expanded}
        className="flex min-h-11 w-full items-center gap-2 rounded-xl px-3 text-left transition-colors hover:bg-border-soft/35"
      >
        <ShoppingBag className="h-4 w-4 shrink-0 text-muted-foreground" aria-hidden />
        <span className="min-w-0 flex-1 text-sm font-semibold text-foreground">
          Pedido · {itemCount} {itemCount === 1 ? "producto" : "productos"}
        </span>
        <span className="text-base font-bold tabular-nums text-foreground">
          {formatCurrency(total)}
        </span>
        <ChevronDown
          className={`h-4 w-4 shrink-0 text-muted-foreground transition-transform ${
            expanded ? "rotate-180" : ""
          }`}
          aria-hidden
        />
      </button>

      <button
        type="button"
        onClick={onSubmit}
        disabled={submitting}
        className="inline-flex min-h-14 w-full items-center justify-center gap-2 rounded-xl bg-accent px-4 text-base font-bold text-accent-foreground shadow-md shadow-accent/20 transition-all hover:bg-accent/90 active:scale-[0.99] disabled:cursor-not-allowed disabled:opacity-60"
      >
        {submitting ? (
          <>
            <Loader2 className="h-5 w-5 animate-spin" aria-hidden />
            Guardando pedido…
          </>
        ) : appendingToTable ? (
          `Agregar a la mesa · ${formatCurrency(total)}`
        ) : (
          "Confirmar y generar QR"
        )}
      </button>
    </div>
  );
}
