import { notFound } from "next/navigation";
import { SearchX } from "lucide-react";

import { CatalogResults } from "@/features/sitio/components/catalog/CatalogResults";
import { CatalogToolbar } from "@/features/sitio/components/catalog/CatalogToolbar";
import { ProductGrid } from "@/features/sitio/components/catalog/ProductGrid";
import { ServiceList } from "@/features/sitio/components/catalog/ServiceList";
import { StoreEmptyState } from "@/features/sitio/components/StoreEmptyState";
import { StorePageHeader } from "@/features/sitio/components/StorePageHeader";

import { StoreSectionHeader } from "@/features/sitio/components/StoreSectionHeader";

import { CATALOG_SORT_VALUES } from "@/features/sitio/constants/catalog";
import { collectionLayout, groupCatalogByType } from "@/features/sitio/helpers/catalogMedia";
import { catalogHref } from "@/features/sitio/helpers/storeLinks";
import {
  getCatalogIndex,
  getStoreTenant,
  listCatalogItems,
} from "@/features/sitio/services/storefrontService";

import type { CatalogState } from "@/features/sitio/interfaces/storeCatalog";
import type { CatalogSort } from "@/features/sitio/interfaces/storefront";
import type { Metadata } from "next";

interface PageProps {
  params: Promise<{ slug: string }>;
  searchParams: Promise<{ subcatalog_id?: string; type?: string; q?: string; sort?: string }>;
}

function readCatalogState(raw: Awaited<PageProps["searchParams"]>): CatalogState {
  return {
    type: raw.type === "product" || raw.type === "service" ? raw.type : null,
    subcatalogId: raw.subcatalog_id || null,
    q: raw.q?.trim() || null,
    sort: CATALOG_SORT_VALUES.has(raw.sort as CatalogSort) ? (raw.sort as CatalogSort) : "featured",
  };
}

function pageTitle(state: CatalogState): string {
  if (state.q) return `Resultados para “${state.q}”`;
  if (state.type === "product") return "Productos";
  if (state.type === "service") return "Servicios";
  return "Catálogo";
}

export async function generateMetadata({ searchParams }: Pick<PageProps, "searchParams">): Promise<Metadata> {
  return { title: pageTitle(readCatalogState(await searchParams)) };
}

export default async function ProductosPage({ params, searchParams }: PageProps) {
  const { slug } = await params;
  const state = readCatalogState(await searchParams);
  const tenant = await getStoreTenant(slug);
  if (!tenant) notFound();

  const [catalog, items] = await Promise.all([
    getCatalogIndex(tenant.id),
    listCatalogItems({
      tenantId: tenant.id,
      type: state.type,
      subcatalogId: state.subcatalogId,
      search: state.q,
      sort: state.sort,
    }),
  ]);

  const category = catalog.categories.find((entry) => entry.id === state.subcatalogId);
  const noun = state.type === "service" ? "servicio" : state.type === "product" ? "producto" : "artículo";
  const countLabel = `${items.length} ${noun}${items.length === 1 ? "" : "s"}${category ? ` en ${category.name}` : ""}`;
  const filtered = Boolean(state.q || state.subcatalogId || state.type);
  const groups = groupCatalogByType(items);

  return (
    <div className="space-y-5 sm:space-y-6">
      <StorePageHeader title={pageTitle(state)} description={countLabel} />
      <CatalogToolbar slug={slug} state={state} counts={catalog.counts} categories={catalog.categories} />

      <CatalogResults key={[state.type, state.subcatalogId, state.q, state.sort].join("|")}>
        {items.length > 0 ? (
          groups.map((group) => (
            <section
              key={group.id}
              aria-labelledby={groups.length > 1 ? `catalog-${group.id}` : undefined}
              aria-label={groups.length > 1 ? undefined : "Resultados del catálogo"}
              className="pt-2"
            >
              {groups.length > 1 ? (
                <StoreSectionHeader
                  id={`catalog-${group.id}`}
                  title={group.title}
                  subtitle={`${group.items.length} disponibles`}
                />
              ) : null}
              {group.id === "services" && collectionLayout(group.items) === "text" ? (
                <div className="rounded-3xl bg-(--store-surface) px-4 shadow-sm ring-1 ring-(--store-hairline) sm:px-6">
                  <ServiceList items={group.items} tenantId={tenant.id} slug={slug} />
                </div>
              ) : (
                <ProductGrid items={group.items} tenantId={tenant.id} slug={slug} />
              )}
            </section>
          ))
        ) : (
          <StoreEmptyState
            icon={SearchX}
            title={state.q ? `Sin resultados para “${state.q}”` : "Nada por aquí todavía"}
            description={
              state.q
                ? "Revisa la ortografía o prueba con una palabra más general."
                : "Este negocio aún no publica artículos con este filtro."
            }
            action={filtered ? { href: catalogHref(slug), label: "Ver todo el catálogo" } : undefined}
          />
        )}
      </CatalogResults>
    </div>
  );
}
