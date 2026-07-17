"use client";

import { Minus, Plus } from "lucide-react";

import { BrandImage } from "@/features/qr/components/BrandImage";
import { formatCurrency } from "@/features/qr/helpers/format";

import type { MenuItem } from "@/features/qr/interfaces/tableCart";

interface MenuProductCardProps {
  product: MenuItem;
  quantity: number;
  onAdd: (productId: string) => void;
  onDecrement?: (productId: string) => void;
  /** Opens the product detail sheet (tapping the text/image area). */
  onOpenDetail?: (product: MenuItem) => void;
  /** Tenant logo, used as fallback when the product has no photo. */
  tenantLogoUrl?: string | null;
  /** Tenant name, used to derive initials when there's no photo or logo. */
  tenantName?: string | null;
}

/**
 * One product on the customer's menu. Image-led layout (the photo is the hook,
 * Uber Eats / Rappi style): a large rounded photo on the left, name +
 * description + price stacked tight on the right, and a circular add control
 * pinned to the bottom-right. In the cart it becomes a compact stepper in the
 * same spot. The whole card taps through to the detail sheet.
 *
 * Adapts to any business: no photo falls back to the tenant logo/initials
 * (BrandImage), no description collapses cleanly. Pure presentational.
 */
export function MenuProductCard({
  product,
  quantity,
  onAdd,
  onDecrement,
  onOpenDetail,
  tenantLogoUrl,
  tenantName,
}: MenuProductCardProps) {
  const inCart = quantity > 0;
  const description = product.description?.trim();

  return (
    <article
      className={`relative flex gap-3 overflow-hidden rounded-2xl border bg-surface p-2.5 transition-all ${
        inCart
          ? "border-accent shadow-md shadow-accent/10"
          : "border-border shadow-sm hover:border-accent/40 hover:shadow-md"
      }`}
    >
      {/* Photo — the hook. Tap to open detail. */}
      <button
        type="button"
        onClick={() => onOpenDetail?.(product)}
        className="block h-24 w-24 shrink-0 cursor-pointer overflow-hidden rounded-xl transition-transform active:scale-[0.98]"
        aria-label={`Ver ${product.name}`}
      >
        <BrandImage
          src={product.image_url}
          logoUrl={tenantLogoUrl}
          name={tenantName}
          alt={product.name}
          className="h-full w-full"
          rounded="rounded-xl"
        />
      </button>

      {/* Text — name/description top, price bottom. Right padding leaves room
          for the floating add control so long names never collide with it. */}
      <button
        type="button"
        onClick={() => onOpenDetail?.(product)}
        className="flex min-w-0 flex-1 cursor-pointer flex-col py-1 pr-11 text-left"
      >
        <h3 className="text-[15px] font-semibold leading-snug text-foreground line-clamp-2">
          {product.name}
        </h3>
        {description && (
          <p className="mt-0.5 text-xs leading-snug text-muted-foreground line-clamp-2">
            {description}
          </p>
        )}
        <p className="mt-auto pt-1 text-base font-bold tracking-tight text-accent">
          {formatCurrency(Number(product.price))}
        </p>
      </button>

      {/* Add control pinned bottom-right */}
      {inCart && onDecrement ? (
        <div className="absolute bottom-2.5 right-2.5 flex items-center gap-0.5 rounded-full border border-accent/30 bg-surface p-0.5 shadow-sm">
          <button
            type="button"
            onClick={() => onDecrement(product.id)}
            aria-label="Quitar uno"
            className="flex h-7 w-7 cursor-pointer items-center justify-center rounded-full text-accent transition-transform hover:bg-accent/10 active:scale-90"
          >
            <Minus className="h-3.5 w-3.5" strokeWidth={2.75} />
          </button>
          <span className="min-w-[16px] text-center text-sm font-bold text-foreground">
            {quantity}
          </span>
          <button
            type="button"
            onClick={() => onAdd(product.id)}
            aria-label="Agregar uno más"
            className="flex h-7 w-7 cursor-pointer items-center justify-center rounded-full bg-accent text-accent-foreground transition-transform hover:bg-accent/90 active:scale-90"
          >
            <Plus className="h-3.5 w-3.5" strokeWidth={2.75} />
          </button>
        </div>
      ) : (
        <button
          type="button"
          onClick={() => onAdd(product.id)}
          aria-label={`Agregar ${product.name}`}
          className="absolute bottom-2.5 right-2.5 flex h-9 w-9 cursor-pointer items-center justify-center rounded-full bg-accent text-accent-foreground shadow-md shadow-accent/25 transition-transform hover:bg-accent/90 active:scale-90"
        >
          <Plus className="h-5 w-5" strokeWidth={2.75} />
        </button>
      )}
    </article>
  );
}
