import Image from "next/image";
import Link from "next/link";

import { formatCurrency } from "@/features/qr/helpers/format";
import {
  storeChip,
  storeChipIdle,
  storeDisplayFont,
  storeFocusRing,
} from "@/features/sitio/constants/storeClasses";
import { categoryIcon, splitFeaturedCategories } from "@/features/sitio/helpers/storeHome";
import { catalogHref } from "@/features/sitio/helpers/storeLinks";

import type { StoreCategory } from "@/features/sitio/interfaces/storefront";

export function CategoryCards({ slug, categories }: { slug: string; categories: StoreCategory[] }) {
  const { featured, others } = splitFeaturedCategories(categories);

  return (
    <section aria-labelledby="home-categories-title" className="space-y-4">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:gap-8">
        <h2
          id="home-categories-title"
          className={`shrink-0 text-xl font-extrabold leading-tight tracking-tight text-(--store-ink) lg:w-40 lg:text-2xl ${storeDisplayFont}`}
        >
          Compra por categoría
        </h2>
        <span aria-hidden className="hidden h-16 w-px shrink-0 bg-(--store-hairline) lg:block" />
        <ul className={`grid flex-1 gap-3 sm:gap-4 ${featured.length >= 3 ? "sm:grid-cols-3" : featured.length === 2 ? "sm:grid-cols-2" : ""}`}>
          {featured.map((category, index) => {
            const Icon = categoryIcon(category.name, index);
            return (
              <li key={category.id}>
                <Link
                  href={catalogHref(slug, { subcatalogId: category.id })}
                  className={`group flex h-full min-h-22 items-center gap-3 overflow-hidden rounded-2xl bg-(--store-surface) py-3 pl-3 pr-3 shadow-sm ring-1 ring-(--store-hairline) transition-[box-shadow,transform] duration-200 hover:shadow-lg motion-safe:hover:-translate-y-0.5 sm:pl-4 ${storeFocusRing}`}
                >
                  <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-accent/12 text-accent">
                    <Icon className="h-6 w-6" aria-hidden />
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="line-clamp-2 text-[15px] font-bold leading-tight text-(--store-ink)">
                      {category.name}
                    </span>
                    <span className="mt-1 block text-[13px] leading-snug text-(--store-ink-2)">
                      {category.count} {category.count === 1 ? "artículo" : "artículos"}
                      <span className="block font-semibold text-(--store-ink)">
                        Desde {formatCurrency(category.minPrice)}
                      </span>
                    </span>
                  </span>
                  {category.image ? (
                    <span className="relative h-16 w-16 shrink-0 rotate-3 overflow-hidden rounded-xl shadow-md ring-1 ring-black/5 motion-safe:transition-transform motion-safe:duration-300 motion-safe:group-hover:rotate-0 motion-safe:group-hover:scale-105 sm:h-18 sm:w-18">
                      <Image src={category.image} alt="" fill sizes="72px" className="object-cover" />
                    </span>
                  ) : null}
                </Link>
              </li>
            );
          })}
        </ul>
      </div>

      {others.length > 0 ? (
        <nav aria-label="Más categorías" className="flex flex-wrap items-center gap-2 lg:pl-48">
          <span className="mr-1 text-sm font-semibold text-(--store-ink-2)">Más categorías:</span>
          {others.map((category) => (
            <Link
              key={category.id}
              href={catalogHref(slug, { subcatalogId: category.id })}
              className={`${storeChip} ${storeChipIdle}`}
            >
              {category.name}
              <span className="ml-1.5 text-(--store-ink-2)">{category.count}</span>
            </Link>
          ))}
        </nav>
      ) : null}
    </section>
  );
}
