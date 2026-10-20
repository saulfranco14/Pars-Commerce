import type { LucideIcon } from "lucide-react";
import type { ReactNode } from "react";

import type { ProductPromotionResult } from "@/lib/promotionPrice";

import type {
  ActivePromotion,
  CatalogItem,
  StoreChrome,
  StoreTheme,
} from "@/features/sitio/interfaces/storefront";

export interface StoreLinkAction {
  href: string;
  label: string;
}

export interface StoreSectionHeaderProps {
  id?: string;
  title: string;
  subtitle?: string;
  action?: StoreLinkAction;
}

export interface StorePageHeaderProps {
  title: string;
  description?: ReactNode;
  back?: StoreLinkAction;
  children?: ReactNode;
}

export interface StoreEmptyStateProps {
  icon: LucideIcon;
  title: string;
  description: string;
  action?: StoreLinkAction;
}

export interface ProductCardProps {
  product: CatalogItem;
  promotion?: ProductPromotionResult | null;
  tenantId: string;
  slug: string;
  priority?: boolean;
  /** "text" drops the image well; used when a whole collection has no photos. */
  layout?: "media" | "text";
}

export interface ProductCollectionProps {
  items: CatalogItem[];
  tenantId: string;
  slug: string;
}

export interface PromotionCardProps {
  promotion: ActivePromotion;
  tenantId: string;
  slug: string;
}

export interface StoreShellProps {
  chrome: StoreChrome;
  theme: StoreTheme;
  accent: string;
  tenantId: string;
  notice?: ReactNode;
  children: ReactNode;
}

export interface StoreHeaderProps {
  chrome: StoreChrome;
}
