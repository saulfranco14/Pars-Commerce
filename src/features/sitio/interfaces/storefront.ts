import type { EnrichedProduct } from "@/lib/enrichProducts";

export type CatalogType = "product" | "service";

export type CatalogSort = "featured" | "newest" | "price_asc" | "price_desc";

export interface StoreTenant {
  id: string;
  name: string;
  description: string | null;
  logo_url: string | null;
  theme_color: string | null;
  site_slug: string;
  whatsapp_phone: string | null;
  whatsapp_orders_enabled: boolean | null;
  social_links: Record<string, string> | null;
  site_template_id: string | null;
  accepting_orders: boolean | null;
  settings: Record<string, unknown> | null;
}

export interface StoreTheme {
  canvas: string;
  surface: string;
  well: string;
  ink: string;
  ink2: string;
  hairline: string;
  radius: string;
  display: string;
  dark: boolean;
}

export interface StoreNavLink {
  id: string;
  label: string;
  href: string;
}

export interface StoreCatalogCounts {
  products: number;
  services: number;
}

export interface StoreChrome {
  slug: string;
  tenantName: string;
  tenantDescription: string | null;
  logoUrl: string | null;
  navLinks: StoreNavLink[];
  quickLinks: StoreNavLink[];
  whatsappPhone: string | null;
  socialLinks: Record<string, string>;
}

export interface ActivePromotion {
  id: string;
  name: string;
  slug: string | null;
  type: string;
  value: number;
  quantity: number | null;
  min_amount: number | null;
  product_ids: string[] | null;
  bundle_product_ids: string[] | null;
  badge_label: string | null;
  valid_from: string | null;
  valid_until: string | null;
  image_url: string | null;
  status?: string | null;
  applies_to?: string | null;
  subcatalog_ids?: string[] | null;
  buy_quantity?: number | null;
  pay_quantity?: number | null;
  /** Up to three product photos for the card when there is no image_url. */
  preview_images?: string[];
}

export interface CatalogQuery {
  tenantId: string;
  type?: CatalogType | null;
  subcatalogId?: string | null;
  search?: string | null;
  sort?: CatalogSort;
  limit?: number;
}

export type CatalogItem = EnrichedProduct;

export interface StoreCategory {
  id: string;
  name: string;
  image: string | null;
  count: number;
  minPrice: number;
}

export interface StoreSearchResult {
  id: string;
  name: string;
  href: string;
  price: number;
  image: string | null;
  type: CatalogType;
}
