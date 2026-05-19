"use client";

import { Minus, Package, Plus } from "lucide-react";

import { formatCurrency } from "@/features/qr/helpers/format";

import type { MenuItem } from "@/features/qr/interfaces/tableCart";

interface MenuProductCardProps {
  product: MenuItem;
  quantity: number;
  onAdd: (productId: string) => void;
  onDecrement?: (productId: string) => void;
}

/**
 * One product card on the customer's menu grid. Two states:
 *  - Out of cart  → big "Agregar" CTA.
 *  - In cart      → inline +/- stepper showing the current quantity.
 *
 * Pure presentational: receives callbacks, never calls services itself.
 */
export function MenuProductCard({
  product,
  quantity,
  onAdd,
  onDecrement,
}: MenuProductCardProps) {
  const inCart = quantity > 0;

  return (
    <article
      className={`flex flex-col overflow-hidden rounded-2xl border bg-surface transition-shadow ${
        inCart
          ? "border-accent shadow-md shadow-accent/10"
          : "border-border"
      }`}
    >
      {product.image_url ? (
        <div className="aspect-[4/3] w-full overflow-hidden bg-border-soft/30">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={product.image_url}
            alt={product.name}
            loading="lazy"
            decoding="async"
            className="h-full w-full object-cover"
          />
        </div>
      ) : (
        <div className="aspect-[4/3] w-full bg-gradient-to-br from-accent/5 to-accent/15 flex items-center justify-center">
          <Package className="h-10 w-10 text-accent/30" />
        </div>
      )}

      <div className="flex flex-1 flex-col gap-3 p-3">
        <div className="flex-1">
          <h3 className="text-sm font-semibold leading-snug text-foreground line-clamp-2">
            {product.name}
          </h3>
          <p className="mt-1 text-base font-bold text-accent">
            {formatCurrency(Number(product.price))}
          </p>
        </div>

        {inCart && onDecrement ? (
          <div className="flex items-center justify-between gap-1 rounded-xl border border-accent/30 bg-accent/5 px-1 py-0.5">
            <button
              type="button"
              onClick={() => onDecrement(product.id)}
              aria-label="Quitar uno"
              className="flex h-8 w-8 cursor-pointer items-center justify-center rounded-lg text-accent hover:bg-accent/10 active:scale-90 transition-transform"
            >
              <Minus className="h-4 w-4" />
            </button>
            <span className="min-w-[20px] text-center text-base font-bold text-foreground">
              {quantity}
            </span>
            <button
              type="button"
              onClick={() => onAdd(product.id)}
              aria-label="Agregar uno más"
              className="flex h-8 w-8 cursor-pointer items-center justify-center rounded-lg bg-accent text-accent-foreground hover:bg-accent/90 active:scale-90 transition-transform"
            >
              <Plus className="h-4 w-4" />
            </button>
          </div>
        ) : (
          <button
            type="button"
            onClick={() => onAdd(product.id)}
            className="inline-flex min-h-[40px] cursor-pointer items-center justify-center gap-1.5 rounded-xl bg-accent px-3 py-2 text-sm font-bold text-accent-foreground hover:bg-accent/90 active:scale-[0.98] transition-transform"
          >
            <Plus className="h-4 w-4" />
            Agregar
          </button>
        )}
      </div>
    </article>
  );
}
