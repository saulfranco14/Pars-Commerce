"use client";

import { Plus } from "lucide-react";

import { BrandImage } from "@/features/qr/components/BrandImage";
import { formatCurrency } from "@/features/qr/helpers/format";

import type { KioskProductTileProps } from "@/features/dispositivos/interfaces/kioskUi";

/**
 * Producto en la rejilla de la pantalla grande. La foto manda: ocupa la mitad
 * de la tarjeta y se mira desde lejos. Toda la tarjeta abre el detalle; el `+`
 * agrega de un toque sin abrirlo.
 */
export function KioskProductTile({
  product,
  quantity,
  onOpen,
  onAdd,
}: KioskProductTileProps) {
  const inCart = quantity > 0;
  const description = product.description?.trim();

  return (
    <article
      className={`relative flex flex-col overflow-hidden rounded-3xl border-2 bg-surface transition-all ${
        inCart
          ? "border-accent shadow-lg shadow-accent/15"
          : "border-border shadow-sm hover:border-accent/40 hover:shadow-lg"
      }`}
    >
      <button
        type="button"
        onClick={() => onOpen(product)}
        className="flex flex-1 cursor-pointer flex-col text-left transition-transform active:scale-[0.99]"
        aria-label={`Ver ${product.name}`}
      >
        {/* Sin `logoUrl` a propósito: en una rejilla grande, seis productos sin
            foto se veían como seis veces el mismo logo. Las iniciales del
            producto sí distinguen una tarjeta de otra. */}
        <BrandImage
          src={product.image_url}
          name={product.name}
          alt={product.name}
          className="aspect-4/3 w-full"
          rounded="rounded-none"
          sizes="(max-width: 1279px) 45vw, 30vw"
          fallbackScale="lg"
        />

        <div className="flex flex-1 flex-col p-5 pb-20">
          <h3 className="text-xl font-bold leading-snug text-foreground line-clamp-2 xl:text-2xl">
            {product.name}
          </h3>
          {description && (
            <p className="mt-1.5 text-base leading-snug text-muted-foreground line-clamp-2">
              {description}
            </p>
          )}
          <p className="mt-auto pt-3 text-3xl font-bold tracking-tight text-accent xl:text-4xl">
            {formatCurrency(Number(product.price))}
          </p>
        </div>
      </button>

      {inCart && (
        <span className="absolute right-4 top-4 flex h-12 min-w-12 items-center justify-center rounded-full bg-accent px-3 text-xl font-bold text-accent-foreground shadow-lg">
          {quantity}
        </span>
      )}

      <button
        type="button"
        onClick={() => onAdd(product.id)}
        aria-label={`Agregar ${product.name}`}
        className="absolute bottom-5 right-5 flex h-16 w-16 cursor-pointer items-center justify-center rounded-full bg-accent text-accent-foreground shadow-xl shadow-accent/30 transition-transform hover:bg-accent/90 active:scale-90"
      >
        <Plus className="h-8 w-8" strokeWidth={3} />
      </button>
    </article>
  );
}
