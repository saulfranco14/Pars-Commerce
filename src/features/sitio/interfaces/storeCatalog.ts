import type {
  CatalogSort,
  CatalogType,
  StoreCatalogCounts,
  StoreCategory,
} from "@/features/sitio/interfaces/storefront";

export interface CatalogState {
  type: CatalogType | null;
  subcatalogId: string | null;
  q: string | null;
  sort: CatalogSort;
}

export interface CatalogToolbarProps {
  slug: string;
  state: CatalogState;
  counts: StoreCatalogCounts;
  categories: StoreCategory[];
}

export interface CatalogSortSelectProps {
  slug: string;
  state: CatalogState;
}
