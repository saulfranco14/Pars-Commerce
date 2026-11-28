import type { AD_ICON_NODES } from "@/features/growth/constants/adIcons";

export type AdKind = "giro" | "name" | "promo" | "prod";
export type AdIconKey = keyof typeof AD_ICON_NODES;
export type AdBackgroundKind = "giro" | "producto";
export type AdField = "text" | "price" | "place";

/** What the owner changed in one ad; missing fields keep the giro default. */
export interface AdEdit {
  text?: string;
  price?: string;
  place?: string;
}

export type AdEdits = Partial<Record<AdKind, AdEdit>>;

export interface GiroAdCopy {
  icon: AdIconKey;
  giroLine: string;
  promo: { what: string; price: string; when: string };
  product: { name: string; price: string };
  /** First message: a question answered with a number. */
  question: string;
  /** Zone report: a promo for the slow hour of this giro, written as a test. */
  slowIdea: string;
  /** Image prompts for the AI background library (English works best with the image model). */
  scenePrompt: string;
  productPrompt: string;
}

/** One ad, ready to draw in the browser or as a PNG. */
export interface AdContent {
  kind: AdKind;
  eyebrow: string;
  headline: string;
  /** Digits only; null for ads without a price. */
  price: string | null;
  detail: string | null;
  cta: string | null;
  icon: AdIconKey;
  backgroundUrl: string | null;
  /** The three-color look when there is no photo. */
  tone: "teal" | "blue" | "gold" | "amber";
}

export interface LeadAdsSource {
  businessName: string;
  giro: string;
  colonia: string | null;
  municipio: string;
  edits: AdEdits;
  backgrounds: Partial<Record<AdBackgroundKind, string | null>>;
}

export interface AdFieldSpec {
  field: AdField;
  label: string;
  maxLength: number;
  numeric: boolean;
}

export interface AdPosterProps {
  ad: AdContent;
  /** Pixel width; every size scales from the 1080-wide design. */
  width: number;
  /** «Muestra gratis · Tlaco» band at the bottom, for ads downloaded without an account. */
  mark: boolean;
  fontFamily: string;
}

export interface AdBackground {
  id: string;
  giro: string;
  kind: AdBackgroundKind;
  url: string;
  status: "pending" | "approved" | "rejected";
  created_at: string;
}
