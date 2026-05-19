"use client";

import { Minus, Plus, ShoppingBag, Trash2 } from "lucide-react";

import { formatCurrency } from "@/features/qr/helpers/format";

interface CartEntry {
  product_id: string;
  product_name: string;
  quantity: number;
  unit_price: number;
}

interface TableCartSheetProps {
  entries: CartEntry[];
  onIncrement: (productId: string) => void;
  onDecrement: (productId: string) => void;
  onRemove: (productId: string) => void;
}

export function TableCartSheet({
  entries,
  onIncrement,
  onDecrement,
  onRemove,
}: TableCartSheetProps) {
  const total = entries.reduce(
    (acc, e) => acc + e.unit_price * e.quantity,
    0,
  );

  return (
    <section className="rounded-xl border border-border bg-surface p-4">
      <div className="flex items-center gap-2">
        <ShoppingBag className="h-4 w-4 text-accent" />
        <h3 className="text-sm font-semibold text-foreground">
          Lo que vas a pedir ({entries.reduce((acc, e) => acc + e.quantity, 0)})
        </h3>
      </div>

      {entries.length === 0 ? (
        <p className="mt-3 text-sm text-muted-foreground">
          Aún no agregas productos.
        </p>
      ) : (
        <>
          <ul className="mt-3 space-y-2">
            {entries.map((entry) => (
              <li
                key={entry.product_id}
                className="flex items-center gap-3 rounded-lg border border-border bg-surface px-3 py-2"
              >
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium text-foreground">
                    {entry.product_name}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {formatCurrency(entry.unit_price)} c/u
                  </p>
                </div>

                <div className="flex items-center gap-1.5 rounded-full border border-border bg-background px-1">
                  <button
                    type="button"
                    onClick={() => onDecrement(entry.product_id)}
                    aria-label="Disminuir"
                    className="flex h-7 w-7 cursor-pointer items-center justify-center rounded-full hover:bg-border-soft/60"
                  >
                    <Minus className="h-3.5 w-3.5" />
                  </button>
                  <span className="min-w-6 text-center text-sm font-semibold text-foreground">
                    {entry.quantity}
                  </span>
                  <button
                    type="button"
                    onClick={() => onIncrement(entry.product_id)}
                    aria-label="Aumentar"
                    className="flex h-7 w-7 cursor-pointer items-center justify-center rounded-full hover:bg-border-soft/60"
                  >
                    <Plus className="h-3.5 w-3.5" />
                  </button>
                </div>

                <span className="w-16 text-right text-sm font-semibold text-foreground">
                  {formatCurrency(entry.unit_price * entry.quantity)}
                </span>

                <button
                  type="button"
                  onClick={() => onRemove(entry.product_id)}
                  aria-label="Quitar"
                  className="flex h-8 w-8 cursor-pointer items-center justify-center rounded-lg text-red-500 hover:bg-red-50"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              </li>
            ))}
          </ul>

          <div className="mt-3 flex items-center justify-between border-t border-border pt-3">
            <span className="text-sm text-muted-foreground">Total a enviar</span>
            <span className="text-base font-bold text-foreground">
              {formatCurrency(total)}
            </span>
          </div>
        </>
      )}
    </section>
  );
}
