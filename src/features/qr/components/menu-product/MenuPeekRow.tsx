"use client";

import { ChevronRight, Plus } from "lucide-react";

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
        className="flex w-full cursor-pointer items-center justify-between gap-3 text-left"
      >
        <span className="flex items-center gap-2.5">
          <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-accent text-accent-foreground">
            <Plus className="h-4 w-4" strokeWidth={2.75} />
          </span>
          <span>
            <span className="block text-sm font-bold text-foreground">
              ¿Quieres pedir algo más?
            </span>
            <span className="block text-xs text-muted-foreground">
              Agrega en un toque o abre el menú completo
            </span>
          </span>
        </span>
        <ChevronRight className="h-5 w-5 shrink-0 text-accent" />
      </button>

      {/* Product rail — one-tap add without opening the menu */}
      <div className="mt-3 flex gap-2.5 overflow-x-auto pb-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
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
          className="flex w-28 shrink-0 cursor-pointer flex-col items-center justify-center gap-2 rounded-xl border border-dashed border-accent/50 bg-accent/5 px-2 py-4 text-center transition-colors hover:bg-accent/10"
        >
          <span className="flex h-8 w-8 items-center justify-center rounded-full bg-accent/15 text-accent">
            <ChevronRight className="h-4 w-4" strokeWidth={2.75} />
          </span>
          <span className="text-xs font-bold text-accent">
            Ver menú completo
          </span>
        </button>
      </div>
    </section>
  );
}
