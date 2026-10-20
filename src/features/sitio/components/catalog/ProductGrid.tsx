import { ProductCard } from "@/features/sitio/components/catalog/ProductCard";

import { collectionLayout } from "@/features/sitio/helpers/catalogMedia";

import type { ProductCollectionProps } from "@/features/sitio/interfaces/storeComponents";

export function ProductGrid({ items, tenantId, slug }: ProductCollectionProps) {
  const layout = collectionLayout(items);
  return (
    <ul className="grid grid-cols-2 gap-3 sm:grid-cols-3 sm:gap-4 lg:grid-cols-4">
      {items.map((item, index) => (
        <li key={item.id}>
          <ProductCard
            product={item}
            promotion={item.promotion}
            tenantId={tenantId}
            slug={slug}
            priority={index < 4}
            layout={layout}
          />
        </li>
      ))}
    </ul>
  );
}
