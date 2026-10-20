import type {
  ActivePromotion,
  StoreCatalogCounts,
  StoreCategory,
  StoreNavLink,
} from "@/features/sitio/interfaces/storefront";

import { catalogHref } from "@/features/sitio/helpers/storeLinks";

interface NavPageRow {
  id: string;
  slug: string;
  title: string;
}

/**
 * Turns the merchant's enabled pages into header links, dropping anything
 * that would lead to an empty screen for this tenant.
 */
export function buildStoreNavLinks(
  slug: string,
  pages: NavPageRow[],
  counts: StoreCatalogCounts,
  hasPromotions: boolean,
): StoreNavLink[] {
  return pages.flatMap((page): StoreNavLink[] => {
    if (page.slug === "productos") {
      const links: StoreNavLink[] = [];
      if (counts.products > 0) {
        links.push({ id: `${page.id}:product`, label: "Productos", href: catalogHref(slug, { type: "product" }) });
      }
      if (counts.services > 0) {
        links.push({ id: `${page.id}:service`, label: "Servicios", href: catalogHref(slug, { type: "service" }) });
      }
      return links;
    }
    if (page.slug === "promociones" && !hasPromotions) return [];
    return [{ id: page.id, label: page.title, href: `/sitio/${slug}/${page.slug}` }];
  });
}

export function buildStoreQuickLinks(
  slug: string,
  counts: StoreCatalogCounts,
  categories: StoreCategory[],
  promotions: ActivePromotion[],
): StoreNavLink[] {
  const links: StoreNavLink[] = [];
  if (counts.products > 0 && counts.services > 0) {
    links.push({ id: "all", label: "Todo el catálogo", href: catalogHref(slug) });
  }
  if (counts.products > 0) links.push({ id: "products", label: "Productos", href: catalogHref(slug, { type: "product" }) });
  if (counts.services > 0) links.push({ id: "services", label: "Servicios", href: catalogHref(slug, { type: "service" }) });
  if (promotions.length > 0) links.push({ id: "promos", label: "Promociones", href: `/sitio/${slug}/promociones` });
  for (const category of categories.slice(0, 6)) {
    links.push({ id: `cat:${category.id}`, label: category.name, href: catalogHref(slug, { subcatalogId: category.id }) });
  }
  return links;
}

export function isNavLinkActive(
  href: string,
  pathname: string,
  searchParams: { get: (key: string) => string | null },
): boolean {
  const [linkPath, linkQuery] = href.split("?");
  if (linkPath.endsWith("/inicio")) return pathname === linkPath || pathname === linkPath.replace(/\/inicio$/, "");
  if (!pathname.startsWith(linkPath)) return false;
  const linkType = new URLSearchParams(linkQuery ?? "").get("type");
  if (!linkType) return true;
  if (pathname !== linkPath) return false;
  return searchParams.get("type") === linkType;
}
