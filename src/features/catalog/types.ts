export type StarterItemSeed = readonly [name: string, price: number, unit?: string];

export interface StarterCategorySeed {
  name: string;
  /** File name under /catalog/starter/abarrotes/; null falls back to the generic product image. */
  cover: string | null;
  description?: string;
  isPublic?: boolean;
  items: readonly StarterItemSeed[];
}

export interface CatalogTemplatePreview {
  key: string;
  version: number;
  business_type: string;
  name: string;
  description: string | null;
  products_count: number;
  services_count: number;
}
