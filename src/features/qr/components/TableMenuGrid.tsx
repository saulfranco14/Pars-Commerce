"use client";

import { Loader2 } from "lucide-react";

import { MenuProductCard } from "@/features/qr/components/MenuProductCard";
import { MenuSearchBar } from "@/features/qr/components/MenuSearchBar";
import { useMenuFilter } from "@/features/qr/hooks/useMenuFilter";

import type { MenuItem } from "@/features/qr/interfaces/tableCart";

interface TableMenuGridProps {
  products: MenuItem[];
  onAdd: (productId: string) => void;
  onDecrement?: (productId: string) => void;
  quantities?: Record<string, number>;
  /** Show the search bar when product count >= this threshold. Default 10. */
  searchThreshold?: number;
}

export function TableMenuGrid({
  products,
  onAdd,
  onDecrement,
  quantities = {},
  searchThreshold = 10,
}: TableMenuGridProps) {
  const filter = useMenuFilter({ products });

  if (products.length === 0) {
    return (
      <p className="rounded-2xl border border-dashed border-border p-8 text-center text-sm text-muted-foreground">
        Este negocio aún no tiene productos disponibles.
      </p>
    );
  }

  const showSearch = products.length >= searchThreshold;

  return (
    <div className="space-y-3">
      {showSearch && (
        <MenuSearchBar
          value={filter.query}
          onChange={filter.setQuery}
          totalCount={filter.totalCount}
          filteredCount={filter.filtered.length}
        />
      )}

      {filter.filtered.length === 0 ? (
        <p className="rounded-2xl border border-dashed border-border p-6 text-center text-sm text-muted-foreground">
          No encontramos productos que coincidan con tu búsqueda.
        </p>
      ) : (
        <>
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
            {filter.visible.map((item) => (
              <MenuProductCard
                key={item.id}
                product={item}
                quantity={quantities[item.id] ?? 0}
                onAdd={onAdd}
                onDecrement={onDecrement}
              />
            ))}
          </div>

          {filter.hasMore && (
            <div
              ref={filter.sentinelRef}
              className="flex items-center justify-center gap-2 py-4 text-xs text-muted-foreground"
            >
              <Loader2 className="h-3.5 w-3.5 animate-spin" />
              Cargando más productos...
            </div>
          )}
        </>
      )}
    </div>
  );
}
