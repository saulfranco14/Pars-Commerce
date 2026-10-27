import Link from "next/link";
import { Search, X } from "lucide-react";

import { CatalogSortSelect } from "@/features/sitio/components/catalog/CatalogSortSelect";
import { CategoryRail } from "@/features/sitio/components/catalog/CategoryRail";

import { storeFocusRing } from "@/features/sitio/constants/storeClasses";
import { catalogHref } from "@/features/sitio/helpers/storeLinks";

import type { CatalogToolbarProps } from "@/features/sitio/interfaces/storeCatalog";

const SEGMENT = `flex min-h-9 flex-1 items-center justify-center rounded-full px-4 text-sm font-medium transition-colors sm:flex-none ${storeFocusRing}`;

export function CatalogToolbar({ slug, state, counts, categories }: CatalogToolbarProps) {
  const { type, subcatalogId, q, sort } = state;
  const scopes = [
    { value: null, label: "Todo" },
    { value: "product" as const, label: "Productos" },
    { value: "service" as const, label: "Servicios" },
  ];
  const showScopes = counts.products > 0 && counts.services > 0;

  return (
    <>
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
        {showScopes ? (
          <nav aria-label="Tipo de catálogo" className="flex rounded-full bg-(--store-well) p-1">
            {scopes.map((scope) => {
              const active = type === scope.value;
              return (
                <Link
                  key={scope.label}
                  href={catalogHref(slug, { type: scope.value, q, sort })}
                  aria-current={active ? "page" : undefined}
                  className={`${SEGMENT} ${
                    active
                      ? "bg-(--store-surface) text-(--store-ink) shadow-sm"
                      : "text-(--store-ink-2) hover:text-(--store-ink)"
                  }`}
                >
                  {scope.label}
                </Link>
              );
            })}
          </nav>
        ) : null}

        <div className="flex flex-1 items-center gap-2">
          <form
            role="search"
            action={`/sitio/${slug}/productos`}
            className="flex min-h-11 flex-1 items-center gap-2 rounded-full bg-(--store-surface) pl-4 pr-1.5 ring-1 ring-(--store-hairline) focus-within:ring-2 focus-within:ring-accent"
          >
            {type ? <input type="hidden" name="type" value={type} /> : null}
            {subcatalogId ? <input type="hidden" name="subcatalog_id" value={subcatalogId} /> : null}
            {sort !== "featured" ? <input type="hidden" name="sort" value={sort} /> : null}
            <Search className="h-4 w-4 shrink-0 text-(--store-ink-2)" aria-hidden />
            <input
              type="search"
              name="q"
              defaultValue={q ?? ""}
              placeholder={type === "service" ? "Buscar servicios" : type === "product" ? "Buscar productos" : "Buscar en la tienda"}
              aria-label="Buscar en el catálogo"
              enterKeyHint="search"
              className="min-w-0 flex-1 bg-transparent text-[15px] text-(--store-ink) outline-none placeholder:text-(--store-ink-2) [&::-webkit-search-cancel-button]:hidden"
            />
            {q ? (
              <Link
                href={catalogHref(slug, { type, subcatalogId, sort })}
                aria-label="Borrar búsqueda"
                className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-(--store-well) text-(--store-ink-2) ${storeFocusRing}`}
              >
                <X className="h-4 w-4" aria-hidden />
              </Link>
            ) : null}
          </form>
          <CatalogSortSelect slug={slug} state={state} />
        </div>
      </div>

      {categories.length > 0 ? <CategoryRail slug={slug} state={state} categories={categories} /> : null}
    </>
  );
}
