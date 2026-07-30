"use client";

import { ArrowRight, ShoppingBag } from "lucide-react";

import { ProductTile } from "@/features/qr/components/menu-product/ProductTile";

import type { MenuItem } from "@/features/qr/interfaces/tableCart";

interface MenuPeekRowProps {
  products: MenuItem[];
  onAdd: (productId: string) => void;
  onOpenDetail: (product: MenuItem) => void;
  /** Expand the full menu (search + categories + grid). */
  onExpand: () => void;
  tenantLogoUrl?: string | null;
  tenantName?: string | null;
}

/** How many products to tease in the horizontal rail. */
const PEEK_COUNT = 8;

/**
 * Collapsed-menu state on the mesa screen (Rappi pattern): instead of a lone
 * "expand" button over empty space, tease a horizontal rail of products the
 * customer can add in ONE tap — photo, price, floating +. A trailing "Ver menú
 * completo" tile (and the header row) expand the full menu.
 *
 * Pure presentational; add/detail/expand are delegated callbacks.
 */
export function MenuPeekRow({
  products,
  onAdd,
  onOpenDetail,
  onExpand,
  tenantLogoUrl,
  tenantName,
}: MenuPeekRowProps) {
  const peek = products.slice(0, PEEK_COUNT);

  return (
    <section className="rounded-2xl border border-border bg-surface p-3 shadow-sm">
      {/* Header — the whole row expands the menu */}
      <button
        type="button"
        onClick={onExpand}
        className="flex min-h-14 w-full cursor-pointer items-center justify-between gap-3 rounded-2xl bg-accent px-4 py-3 text-left text-accent-foreground shadow-md shadow-accent/20 transition-all hover:bg-accent/90 active:scale-[0.99] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2"
      >
        <span className="flex items-center gap-3">
          <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-white/15">
            <ShoppingBag className="h-5 w-5" strokeWidth={2.5} />
          </span>
          <span>
            <span className="block text-base font-bold">
              Pedir algo más
            </span>
            <span className="block text-xs text-accent-foreground/80">
              Abrir el menú completo
            </span>
          </span>
        </span>
        <ArrowRight className="h-5 w-5 shrink-0" strokeWidth={2.5} />
      </button>

      {/* Product rail — one-tap add without opening the menu */}
      <div className="mt-3 flex items-center justify-between gap-3">
        <h3 className="text-sm font-bold text-foreground">Para tu mesa</h3>
        <button
          type="button"
          onClick={onExpand}
          className="min-h-12 cursor-pointer px-1 text-xs font-bold text-accent transition-colors hover:text-accent/80 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent"
        >
          Ver todo
        </button>
      </div>
      <div className="mt-1.5 flex gap-2.5 overflow-x-auto pb-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
        {peek.map((product) => (
          <ProductTile
            key={product.id}
            product={product}
            onAdd={onAdd}
            onOpenDetail={onOpenDetail}
            tenantLogoUrl={tenantLogoUrl}
            tenantName={tenantName}
          />
        ))}

        {/* Trailing expand tile */}
        <button
          type="button"
          onClick={onExpand}
          className="flex min-h-28 w-28 shrink-0 cursor-pointer flex-col items-center justify-center gap-2 rounded-xl border border-dashed border-accent/50 bg-accent/5 px-2 py-4 text-center transition-colors hover:bg-accent/10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent"
        >
          <span className="flex h-8 w-8 items-center justify-center rounded-full bg-accent/15 text-accent">
            <ArrowRight className="h-4 w-4" strokeWidth={2.75} />
          </span>
          <span className="text-xs font-bold text-accent">
            Ver menú completo
          </span>
        </button>
      </div>
    </section>
  );
}
