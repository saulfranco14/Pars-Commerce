"use client";

import { useMemo } from "react";
import useSWR from "swr";

import { swrFetcher } from "@/lib/swrFetcher";
import { productsKey, subcatalogsKey } from "@/features/promociones/helpers/swrKeys";

import type { PickerItem, PickerSubcatalog } from "@/features/promociones/interfaces/offerWizard";

/** Public catalog items a promotion can point at, plus their categories. */
export function usePromotionCatalog(tenantId: string | null) {
  const { data: products, isLoading } = useSWR<PickerItem[]>(tenantId ? productsKey(tenantId) : null, swrFetcher);
  const { data: subcatalogs } = useSWR<PickerSubcatalog[]>(tenantId ? subcatalogsKey(tenantId) : null, swrFetcher);

  const items = useMemo(
    () =>
      (Array.isArray(products) ? products : [])
        .filter((item) => item.is_public !== false)
        .map((item) => ({ ...item, price: Number(item.price) })),
    [products],
  );
  const itemsById = useMemo(() => new Map(items.map((item) => [item.id, item])), [items]);

  return {
    items,
    itemsById,
    subcatalogs: Array.isArray(subcatalogs) ? subcatalogs : [],
    isLoading,
  };
}
