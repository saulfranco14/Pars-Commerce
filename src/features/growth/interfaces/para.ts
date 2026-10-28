import type { HeroShowcaseItem } from "@/features/sitio/interfaces/storeHome";
import type { StoreCatalogCounts } from "@/features/sitio/interfaces/storefront";

/** `para_seconds` only arrives from pages cached before `para_left` replaced it. */
export type ParaLinkEvent = "para_viewed" | "para_seconds" | "para_left" | "claim_clicked" | "help_clicked";

export type ParaSection = "intro" | "tienda" | "productos" | "cierre";

export type ParaPlacement = "bar" | "intro" | "final";

export type ParaAction = `claim:${ParaPlacement}` | `help:${ParaPlacement}`;

/** What one visit saw and tapped, reported when the prospect leaves the page. */
export interface ParaSessionPayload {
  sections: ParaSection[];
  actions: ParaAction[];
  items: string[];
}

export interface ParaEventInput {
  seconds?: number;
  payload?: unknown;
}

export interface ParaSender {
  name: string;
  firstName: string;
  initial: string;
}

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
  headline: string;
  sender: ParaSender | null;
  items: ParaItem[];
  showcase: HeroShowcaseItem[];
  counts: StoreCatalogCounts;
  claimUrl: string;
  helpUrl: string | null;
  helpLabel: string;
}

export interface ParaActionsProps {
  claimUrl: string;
  helpUrl: string | null;
  helpLabel: string;
  /** `bar` is the sticky strip, `intro` the owner card and `block` the closing call to action. */
  layout: "bar" | "intro" | "block";
}

export interface ParaStorefrontProps {
  data: ParaPageData;
}
