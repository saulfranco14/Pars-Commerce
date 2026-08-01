"use client";

import { Loader2, Minus, Plus, ShoppingBag } from "lucide-react";

import { formatCurrency } from "@/features/qr/helpers/format";

import type { StaffOrderCartPanelProps } from "@/features/qr/interfaces/staffOrderCart";

// Anchored at the bottom: on a portrait tablet the thumb reaches the lower
// third, not the top.
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
  if (itemCount === 0) {
    return (
      <div className="flex items-center justify-center gap-2 rounded-2xl border border-border bg-surface px-4 py-5 text-sm text-muted-foreground">
        <ShoppingBag className="h-4 w-4 shrink-0" aria-hidden />
        Toca un producto para empezar el pedido
      </div>
    );
  }

  return (
    <div className="rounded-2xl border border-border bg-surface shadow-lg">
      <div className="flex items-center justify-between px-4 pt-3">
        <span className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
          Pedido · {itemCount} {itemCount === 1 ? "producto" : "productos"}
        </span>
      </div>

      {/* Altura acotada para que el carrito no se coma la rejilla cuando el
          pedido crece; a partir de ahí desplaza solo esta lista. */}
      <ul className="max-h-32 space-y-1 overflow-y-auto px-4 py-2 sm:max-h-52">
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
                className="flex h-11 w-11 cursor-pointer items-center justify-center rounded-full text-accent transition-transform hover:bg-accent/10 active:scale-90"
              >
                <Minus className="h-4 w-4" strokeWidth={2.75} aria-hidden />
              </button>
              <span className="min-w-6 text-center text-base font-bold tabular-nums text-foreground">
                {line.quantity}
              </span>
              <button
                type="button"
                onClick={() => onAdd(line.product.id)}
                aria-label={`Agregar uno más de ${line.product.name}`}
                className="flex h-11 w-11 cursor-pointer items-center justify-center rounded-full bg-accent text-accent-foreground transition-transform hover:bg-accent/90 active:scale-90"
              >
                <Plus className="h-4 w-4" strokeWidth={2.75} aria-hidden />
              </button>
            </div>

            <span className="w-20 shrink-0 text-right text-sm font-bold tabular-nums text-foreground">
              {formatCurrency(Number(line.product.price) * line.quantity)}
            </span>
          </li>
        ))}
      </ul>

      <div className="space-y-2 px-4 pb-4 pt-1">
        {error && (
          <p className="text-sm font-medium text-red-600" role="alert">
            {error}
          </p>
        )}

        <div className="flex items-baseline justify-between">
          <span className="text-sm font-medium text-muted-foreground">
            Total
          </span>
          {/* El monto es el protagonista: quien cobra lo lee de un vistazo. */}
          <span className="text-3xl font-bold tracking-tight tabular-nums text-foreground">
            {formatCurrency(total)}
          </span>
        </div>

        <button
          type="button"
          onClick={onSubmit}
          disabled={submitting}
          className="inline-flex min-h-14 w-full cursor-pointer items-center justify-center gap-2 rounded-2xl bg-accent px-4 text-base font-bold text-accent-foreground shadow-md shadow-accent/20 transition-all hover:bg-accent/90 active:scale-[0.99] disabled:cursor-not-allowed disabled:opacity-60"
        >
          {submitting ? (
            <>
              <Loader2 className="h-5 w-5 animate-spin" aria-hidden />
              Creando pedido…
            </>
          ) : appendingToTable ? (
            "Agregar a la mesa"
          ) : (
            "Confirmar y generar QR"
          )}
        </button>
      </div>
    </div>
  );
}
