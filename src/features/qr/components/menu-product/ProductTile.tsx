"use client";

import { Plus } from "lucide-react";

import { BrandImage } from "@/features/qr/components/BrandImage";
import { formatCurrency } from "@/features/qr/helpers/format";

import type { MenuItem } from "@/features/qr/interfaces/tableCart";

interface ProductTileProps {
  product: MenuItem;
  onAdd: (productId: string) => void;
  onOpenDetail: (product: MenuItem) => void;
  tenantLogoUrl?: string | null;
  tenantName?: string | null;
}

/**
 * Compact product tile for horizontal rails (peek row, "vuelve a pedir"):
 * square photo, name, price, and a floating + for one-tap add. Tapping the
 * tile opens the detail sheet. Shared by every rail — do not re-implement.
 */
export function ProductTile({
  product,
  onAdd,
  onOpenDetail,
  tenantLogoUrl,
  tenantName,
}: ProductTileProps) {
  return (
    <div className="relative w-28 shrink-0">
      <button
        type="button"
        onClick={() => onOpenDetail(product)}
        className="block w-full cursor-pointer text-left"
        aria-label={`Ver ${product.name}`}
      >
        <BrandImage
          src={product.image_url}
          logoUrl={tenantLogoUrl}
          name={tenantName}
          alt={product.name}
          className="aspect-square w-full"
          rounded="rounded-xl"
        />
        <p className="mt-1.5 text-xs font-semibold leading-snug text-foreground line-clamp-2">
          {product.name}
        </p>
        <p className="mt-0.5 text-sm font-bold tracking-tight text-accent">
          {formatCurrency(Number(product.price))}
        </p>
      </button>
      <button
        type="button"
        onClick={() => onAdd(product.id)}
        aria-label={`Agregar ${product.name}`}
        className="absolute right-1.5 top-1.5 flex h-8 w-8 cursor-pointer items-center justify-center rounded-full bg-surface text-accent shadow-md transition-transform hover:bg-accent hover:text-accent-foreground active:scale-90"
      >
        <Plus className="h-4 w-4" strokeWidth={2.75} />
      </button>
    </div>
  );
}
