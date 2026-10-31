import type { HeroShowcaseItem } from "@/features/sitio/interfaces/storeHome";
import type { StoreCatalogCounts } from "@/features/sitio/interfaces/storefront";

/** `para_seconds` only arrives from pages cached before `para_left` replaced it. */
export type ParaLinkEvent = "para_viewed" | "para_seconds" | "para_left" | "claim_clicked" | "help_clicked" | "objection_chosen" | "visit_requested";

export type ParaSection = "intro" | "tienda" | "productos" | "dudas" | "cierre";

export type ParaObjection = "costo" | "tiempo" | "duda" | "whatsapp";

export type ParaVisitSlot = "manana" | "tarde";

export interface ParaVisitDay {
  /** YYYY-MM-DD in the business's time zone. */
  value: string;
  label: string;
}

export interface ParaVisitRequest {
  day: string;
  slot: ParaVisitSlot;
}

export interface ParaVisitOffer {
  days: ParaVisitDay[];
  label: string;
}

export interface ParaObjectionOption {
  id: ParaObjection;
  label: string;
  /** `who` is the sender's first name, or a generic «alguien de Tlaco». */
  answer: (who: string) => string;
  next: "claim" | "visit" | "help";
}

export type ParaPlacement = "bar" | "intro" | "dudas" | "final";

export type ParaAction = `claim:${ParaPlacement}` | `help:${ParaPlacement}` | `visit:${ParaPlacement}`;

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
  kind: "store";
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
  /** Only for businesses in the zones where visits are made. */
  visit: ParaVisitOffer | null;
}

export interface ParaActionsProps {
  claimUrl: string;
  helpUrl: string | null;
  helpLabel: string;
  /** `bar` is the sticky strip, `intro` the owner card and `block` the closing call to action. */
  layout: "bar" | "intro" | "block";
  /** Extra action for the closing block, shown between activating and WhatsApp. */
  children?: React.ReactNode;
}

export interface ParaVisitButtonProps {
  token: string;
  offer: ParaVisitOffer;
  placement: ParaPlacement;
}

export interface ParaInteractiveProps {
  token: string;
  data: ParaPageData;
}

/** «Para ti» sent by a business that prospects with Tlaco: its offer and products, not a sample store. */
export interface ParaOfferData {
  kind: "offer";
  businessName: string;
  workspaceName: string;
  logoUrl: string | null;
  title: string;
  text: string | null;
  ctaLabel: string;
  sender: ParaSender | null;
  items: ParaItem[];
  helpUrl: string | null;
}

export interface ParaOfferProps {
  data: ParaOfferData;
}
