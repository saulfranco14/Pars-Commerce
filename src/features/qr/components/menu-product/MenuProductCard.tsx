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
  /** `touch` grows the controls to 44px, for order-taking on a tablet. */
  density?: "default" | "touch";
}

const DENSITY = {
  default: {
    photo: "h-24 w-24",
    textPad: "pr-11",
    addBtn: "h-9 w-9",
    addIcon: "h-5 w-5",
    stepBtn: "h-7 w-7",
    stepIcon: "h-3.5 w-3.5",
    qtyText: "text-sm",
    name: "text-[15px]",
    price: "text-base",
  },
  touch: {
    photo: "h-24 w-24",
    // El stepper de 44px mide ~112px de ancho; con menos hueco se monta encima
    // del precio.
    textPad: "pr-28",
    addBtn: "h-11 w-11",
    addIcon: "h-6 w-6",
    stepBtn: "h-11 w-11",
    stepIcon: "h-4 w-4",
    qtyText: "text-base",
    name: "text-base",
    price: "text-lg",
  },
} as const;

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
  density = "default",
}: MenuProductCardProps) {
  const inCart = quantity > 0;
  const description = product.description?.trim();
  const d = DENSITY[density];

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
        className={`block ${d.photo} shrink-0 cursor-pointer overflow-hidden rounded-xl transition-transform active:scale-[0.98]`}
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
        className={`flex min-w-0 flex-1 cursor-pointer flex-col py-1 ${d.textPad} text-left`}
      >
        <h3 className={`${d.name} font-semibold leading-snug text-foreground line-clamp-2`}>
          {product.name}
        </h3>
        {description && (
          <p className="mt-0.5 text-xs leading-snug text-muted-foreground line-clamp-2">
            {description}
          </p>
        )}
        <p className={`mt-auto pt-1 ${d.price} font-bold tracking-tight text-accent`}>
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
            className={`flex ${d.stepBtn} cursor-pointer items-center justify-center rounded-full text-accent transition-transform hover:bg-accent/10 active:scale-90`}
          >
            <Minus className={d.stepIcon} strokeWidth={2.75} />
          </button>
          <span className={`min-w-4 text-center ${d.qtyText} font-bold text-foreground`}>
            {quantity}
          </span>
          <button
            type="button"
            onClick={() => onAdd(product.id)}
            aria-label="Agregar uno más"
            className={`flex ${d.stepBtn} cursor-pointer items-center justify-center rounded-full bg-accent text-accent-foreground transition-transform hover:bg-accent/90 active:scale-90`}
          >
            <Plus className={d.stepIcon} strokeWidth={2.75} />
          </button>
        </div>
      ) : (
        <button
          type="button"
          onClick={() => onAdd(product.id)}
          aria-label={`Agregar ${product.name}`}
          className={`absolute bottom-2.5 right-2.5 flex ${d.addBtn} cursor-pointer items-center justify-center rounded-full bg-accent text-accent-foreground shadow-md shadow-accent/25 transition-transform hover:bg-accent/90 active:scale-90`}
        >
          <Plus className={d.addIcon} strokeWidth={2.75} />
        </button>
      )}
    </article>
  );
}
