"use client";

import { useEffect, useState } from "react";
import { Minus, Plus, ShoppingBag } from "lucide-react";

import { FormSheet } from "@/components/ui/FormSheet";
import { ProductImageGallery } from "@/features/qr/components/menu-product/ProductImageGallery";
import { formatCurrency } from "@/features/qr/helpers/format";

import type { KioskProductDialogProps } from "@/features/dispositivos/interfaces/kioskUi";

/**
 * El detalle del producto en la pantalla grande: foto a la izquierda, nombre,
 * descripción y cantidad a la derecha. Es lo que faltaba para que el cliente
 * sepa qué está pidiendo antes de pedirlo.
 */
export function KioskProductDialog({
  product,
  isOpen,
  onClose,
  inCartQuantity,
  onAdd,
  tenantLogoUrl,
}: KioskProductDialogProps) {
  const [qty, setQty] = useState(1);

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
    <FormSheet
      isOpen={isOpen}
      onClose={onClose}
      title=""
      maxWidth="max-w-4xl"
      footer={
        <div className="flex items-center gap-4">
          <button
            type="button"
            onClick={onClose}
            className="inline-flex min-h-16 cursor-pointer items-center justify-center rounded-2xl border-2 border-border bg-surface px-8 text-lg font-semibold text-foreground transition-colors hover:bg-border-soft/60"
          >
            Volver
          </button>
          <button
            type="button"
            onClick={handleAdd}
            className="inline-flex min-h-16 flex-1 cursor-pointer items-center justify-center gap-3 rounded-2xl bg-accent px-8 text-xl font-bold text-accent-foreground shadow-lg shadow-accent/25 transition-all hover:bg-accent/90 active:scale-[0.99]"
          >
            <ShoppingBag className="h-6 w-6 shrink-0" aria-hidden />
            Agregar · {formatCurrency(lineTotal)}
          </button>
        </div>
      }
    >
      <div className="grid gap-6 md:grid-cols-2">
        <ProductImageGallery
          images={
            product.image_urls?.length
              ? product.image_urls
              : product.image_url
                ? [product.image_url]
                : []
          }
          logoUrl={tenantLogoUrl}
          name={product.name}
          alt={product.name}
          className="aspect-square w-full"
          rounded="rounded-3xl"
        />

        <div className="flex flex-col gap-4">
          <div>
            <h2 className="text-3xl font-bold leading-tight tracking-tight text-foreground xl:text-4xl">
              {product.name}
            </h2>
            <p className="mt-2 text-4xl font-bold tracking-tight text-accent">
              {formatCurrency(Number(product.price))}
            </p>
          </div>

          {product.description && (
            <p className="text-lg leading-relaxed text-muted-foreground">
              {product.description}
            </p>
          )}

          {inCartQuantity > 0 && (
            <p className="rounded-2xl bg-border-soft/50 px-4 py-3 text-base font-medium text-muted-foreground">
              Ya llevas {inCartQuantity} en tu pedido. Esto agrega más.
            </p>
          )}

          <div className="mt-auto flex items-center justify-between rounded-2xl border-2 border-border bg-surface px-5 py-3">
            <span className="text-lg font-bold text-foreground">Cantidad</span>
            <div className="flex items-center gap-5">
              <button
                type="button"
                onClick={() => setQty((q) => Math.max(1, q - 1))}
                disabled={qty <= 1}
                aria-label="Quitar uno"
                className="flex h-14 w-14 cursor-pointer items-center justify-center rounded-2xl border-2 border-border text-foreground transition-transform hover:bg-border-soft/40 active:scale-90 disabled:opacity-40"
              >
                <Minus className="h-6 w-6" strokeWidth={2.75} />
              </button>
              <span className="min-w-10 text-center text-3xl font-bold tabular-nums text-foreground">
                {qty}
              </span>
              <button
                type="button"
                onClick={() => setQty((q) => q + 1)}
                aria-label="Agregar uno más"
                className="flex h-14 w-14 cursor-pointer items-center justify-center rounded-2xl bg-accent text-accent-foreground transition-transform hover:bg-accent/90 active:scale-90"
              >
                <Plus className="h-6 w-6" strokeWidth={2.75} />
              </button>
            </div>
          </div>
        </div>
      </div>
    </FormSheet>
  );
}
