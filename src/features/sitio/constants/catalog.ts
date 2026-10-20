import type { CatalogSort } from "@/features/sitio/interfaces/storefront";

export const CATALOG_SORT_OPTIONS: { value: CatalogSort; label: string }[] = [
  { value: "featured", label: "Destacados" },
  { value: "newest", label: "Lo más nuevo" },
  { value: "price_asc", label: "Precio: menor a mayor" },
  { value: "price_desc", label: "Precio: mayor a menor" },
];

export const CATALOG_SORT_VALUES = new Set<CatalogSort>(
  CATALOG_SORT_OPTIONS.map((option) => option.value),
);

export const HOME_PRODUCTS_LIMIT = 8;

export const HOME_SERVICES_LIMIT = 6;

export const SEARCH_MIN_CHARS = 2;

export const SEARCH_RESULTS_LIMIT = 6;
