import type { HeroShowcaseItem } from "@/features/sitio/interfaces/storeHome";
import type { StoreCatalogCounts } from "@/features/sitio/interfaces/storefront";

export type ParaLinkEvent = "para_viewed" | "para_seconds" | "claim_clicked" | "help_clicked";

export interface ParaItem {
  id: string;
  name: string;
  price: number;
  imageUrl: string | null;
  category: string | null;
  type: "product" | "service";
}

export interface ParaPageData {
  businessName: string;
  giroLabel: string;
  place: string;
  items: ParaItem[];
  showcase: HeroShowcaseItem[];
  counts: StoreCatalogCounts;
  claimUrl: string;
  helpUrl: string | null;
}

export interface ParaActionsProps {
  token: string;
  claimUrl: string;
  helpUrl: string | null;
  /** `bar` is the compact sticky strip; `block` the full call to action. */
  layout?: "block" | "bar";
}

export interface ParaStorefrontProps {
  data: ParaPageData;
}
