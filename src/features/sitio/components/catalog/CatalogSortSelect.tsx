"use client";

import { useRouter } from "next/navigation";
import { ArrowUpDown } from "lucide-react";

import { CATALOG_SORT_OPTIONS } from "@/features/sitio/constants/catalog";
import { catalogHref } from "@/features/sitio/helpers/storeLinks";

import type { CatalogSortSelectProps } from "@/features/sitio/interfaces/storeCatalog";
import type { CatalogSort } from "@/features/sitio/interfaces/storefront";

export function CatalogSortSelect({ slug, state }: CatalogSortSelectProps) {
  const router = useRouter();

  return (
    <label className="relative flex min-h-11 shrink-0 items-center rounded-full bg-(--store-surface) ring-1 ring-(--store-hairline) focus-within:ring-2 focus-within:ring-accent">
      <span className="sr-only">Ordenar</span>
      <ArrowUpDown className="pointer-events-none absolute left-3.5 h-4 w-4 text-(--store-ink-2)" aria-hidden />
      <select
        value={state.sort}
        onChange={(event) =>
          router.push(catalogHref(slug, { ...state, sort: event.target.value as CatalogSort }), { scroll: false })
        }
        className="h-11 w-11 cursor-pointer appearance-none rounded-full bg-transparent pl-10 text-sm text-transparent outline-none sm:w-auto sm:pr-4 sm:text-(--store-ink)"
      >
        {CATALOG_SORT_OPTIONS.map((option) => (
          <option key={option.value} value={option.value} className="text-black">
            {option.label}
          </option>
        ))}
      </select>
    </label>
  );
}
