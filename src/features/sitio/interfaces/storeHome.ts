import type { LucideIcon } from "lucide-react";

import type { StoreLinkAction } from "@/features/sitio/interfaces/storeComponents";
import type { CatalogItem } from "@/features/sitio/interfaces/storefront";
import type {
  SitePageCard,
  SitePageFaqItem,
  SitePagePurchaseStep,
} from "@/types/tenantSitePages";

export interface HeroShowcaseItem {
  id: string;
  name: string;
  price: number;
  image: string;
  href: string;
}

export interface StoreHeroProps {
  tenantName: string;
  logoUrl: string | null;
  title: string;
  subtitle: string | null;
  imageUrl: string | null;
  showcase: HeroShowcaseItem[];
  primary: StoreLinkAction;
  secondary?: StoreLinkAction;
}

export interface StoreHighlight {
  id: string;
  icon: LucideIcon;
  title: string;
  detail: string;
}

export interface ServiceMenuProps {
  items: CatalogItem[];
  tenantId: string;
  slug: string;
}

export interface StoreClosingCtaProps {
  title: string;
  description: string;
  action: StoreLinkAction & { external?: boolean };
}

export interface StoreValueCardsProps {
  cards: SitePageCard[];
}

export interface StorePurchaseStepsProps {
  steps: SitePagePurchaseStep[];
}

export interface StoreFaqProps {
  items: SitePageFaqItem[];
}
