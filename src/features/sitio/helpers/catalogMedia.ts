import type { CatalogItem } from "@/features/sitio/interfaces/storefront";

/** Products and services read differently (and often only one has photos), so a mixed list splits. */
export function groupCatalogByType(items: CatalogItem[]): { id: string; title: string; items: CatalogItem[] }[] {
  const products = items.filter((item) => item.type !== "service");
  const services = items.filter((item) => item.type === "service");
  return [
    { id: "products", title: "Productos", items: products },
    { id: "services", title: "Servicios", items: services },
  ].filter((group) => group.items.length > 0);
}

/** A row of empty image wells reads as broken; without photos the cards go text-first. */
export function collectionLayout(items: CatalogItem[]): "media" | "text" {
  return items.some((item) => item.image_urls.length > 0 || item.image_url) ? "media" : "text";
}
