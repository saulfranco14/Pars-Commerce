"use client";

import { RotateCcw } from "lucide-react";

import { ProductTile } from "@/features/qr/components/menu-product/ProductTile";

import type { MenuItem } from "@/features/qr/interfaces/tableCart";

interface ReorderRowProps {
  /** Unique products this table already ordered, most recent first. */
  products: MenuItem[];
  onAdd: (productId: string) => void;
  onOpenDetail: (product: MenuItem) => void;
  tenantLogoUrl?: string | null;
  tenantName?: string | null;
}

/**
 * "Vuelve a pedir" rail (the Rappi pattern): what the table already ordered,
 * repeatable in one tap. Rendered under the order tracker once there's at
 * least one sent item — the highest-conversion surface on the screen, since
 * repeating the last round is the most common follow-up at a table.
 */
export function ReorderRow({
  products,
  onAdd,
  onOpenDetail,
  tenantLogoUrl,
  tenantName,
}: ReorderRowProps) {
  if (products.length === 0) return null;

  return (
    <section className="rounded-2xl border border-border bg-surface p-3 shadow-sm">
      <div className="flex items-center gap-2.5">
        <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-accent/10 text-accent">
          <RotateCcw className="h-4 w-4" strokeWidth={2.5} />
        </span>
        <div>
          <h3 className="text-sm font-bold text-foreground">Vuelve a pedir</h3>
          <p className="text-xs text-muted-foreground">
            Repite lo de tu última ronda en un toque
          </p>
        </div>
      </div>

      <div className="mt-3 flex gap-2.5 overflow-x-auto pb-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
        {products.map((product) => (
          <ProductTile
            key={product.id}
            product={product}
            onAdd={onAdd}
            onOpenDetail={onOpenDetail}
            tenantLogoUrl={tenantLogoUrl}
            tenantName={tenantName}
          />
        ))}
      </div>
    </section>
  );
}
