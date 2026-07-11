"use client";

import { useEffect, useState } from "react";
import { Minus, Plus, ShoppingBag } from "lucide-react";

import { FormSheet } from "@/components/ui/FormSheet";
import { BrandImage } from "@/features/qr/components/BrandImage";
import { formatCurrency } from "@/features/qr/helpers/format";

import type { MenuItem } from "@/features/qr/interfaces/tableCart";

interface ProductDetailSheetProps {
  product: MenuItem | null;
  isOpen: boolean;
  onClose: () => void;
  /** How many of this product are already staged in the cart. */
  inCartQuantity: number;
  /** Add `qty` units of the product to the cart. */
  onAdd: (productId: string, qty: number) => void;
  tenantLogoUrl?: string | null;
  tenantName?: string | null;
}

/**
 * Detail view shown when a customer taps a product card. Big image, name,
 * price, description and a quantity stepper — so any business (restaurant,
 * mechanic, spa) can show what the product is before it goes in the order.
 * Presentational: staging is delegated via onAdd.
 */
export function ProductDetailSheet({
  product,
  isOpen,
  onClose,
  inCartQuantity,
  onAdd,
  tenantLogoUrl,
  tenantName,
}: ProductDetailSheetProps) {
  const [qty, setQty] = useState(1);

  // Reset the local quantity each time a new product opens.
  useEffect(() => {
    if (isOpen) setQty(1);
  }, [isOpen, product?.id]);

  if (!product) return null;

  const lineTotal = Number(product.price) * qty;

  function handleAdd() {
    if (!product) return;
    onAdd(product.id, qty);
    onClose();
  }

  return (
    <FormSheet isOpen={isOpen} onClose={onClose} title="" description="">
      <div className="space-y-4">
        <BrandImage
          src={product.image_url}
          logoUrl={tenantLogoUrl}
          name={tenantName}
          alt={product.name}
          className="aspect-[16/10] w-full"
          rounded="rounded-2xl"
        />

        <div>
          <h2 className="text-xl font-bold tracking-tight text-foreground">
            {product.name}
          </h2>
          <p className="mt-1 text-2xl font-bold text-accent">
            {formatCurrency(Number(product.price))}
          </p>
        </div>

        {product.description && (
          <p className="text-sm leading-relaxed text-muted-foreground">
            {product.description}
          </p>
        )}

        {inCartQuantity > 0 && (
          <p className="rounded-xl bg-border-soft/40 px-3 py-2 text-xs font-medium text-muted-foreground">
            Ya tienes {inCartQuantity} en tu pedido. Esto agrega más.
          </p>
        )}

        {/* Quantity stepper */}
        <div className="flex items-center justify-between rounded-2xl border border-border bg-surface px-4 py-2.5">
          <span className="text-sm font-bold text-foreground">Cantidad</span>
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => setQty((q) => Math.max(1, q - 1))}
              aria-label="Quitar uno"
              className="flex h-9 w-9 cursor-pointer items-center justify-center rounded-xl border border-border text-foreground transition-transform hover:bg-border-soft/40 active:scale-90 disabled:opacity-40"
              disabled={qty <= 1}
            >
              <Minus className="h-4 w-4" />
            </button>
            <span className="min-w-6 text-center text-lg font-bold text-foreground">
              {qty}
            </span>
            <button
              type="button"
              onClick={() => setQty((q) => q + 1)}
              aria-label="Agregar uno más"
              className="flex h-9 w-9 cursor-pointer items-center justify-center rounded-xl bg-accent text-accent-foreground transition-transform hover:bg-accent/90 active:scale-90"
            >
              <Plus className="h-4 w-4" />
            </button>
          </div>
        </div>

        <button
          type="button"
          onClick={handleAdd}
          className="flex min-h-[54px] w-full cursor-pointer items-center justify-center gap-2 rounded-2xl bg-accent px-4 text-base font-bold text-accent-foreground shadow-md shadow-accent/20 transition-all hover:bg-accent/90 active:scale-[0.99]"
        >
          <ShoppingBag className="h-5 w-5" />
          Agregar {qty > 1 ? `${qty} ` : ""}· {formatCurrency(lineTotal)}
        </button>
      </div>
    </FormSheet>
  );
}
