import type { AdKind, LeadAdsSource } from "@/features/growth/interfaces/prospectAds";
import type { ParaSender } from "@/features/growth/interfaces/para";

export interface ParaZoneTeaser {
  within500: number;
  /** «cafeterías», «tiendas»… */
  plural: string;
}

/** Everything the «Sus anuncios» page needs; the lead id never leaves the server. */
export interface ParaAdsPageData {
  kind: "ads";
  /** Drawn in the browser too, so typing changes the ad at once. */
  source: LeadAdsSource;
  /** The name to greet with, or null when DENUE has none worth printing. */
  displayName: string | null;
  giroLabel: string;
  zone: ParaZoneTeaser | null;
  sender: ParaSender | null;
  helpUrl: string | null;
  prefill: {
    businessName: string;
    /** 10 digits, or empty when the prospect has no phone. */
    phone: string;
    businessType: string;
    catalogKey: string | null;
  };
}

export interface ParaAdsViewProps {
  token: string;
  data: ParaAdsPageData;
}

export interface ParaSignupValues {
  businessName: string;
  phone: string;
  email: string;
  password: string;
}

export type ParaAdsEvent = "ad_edited" | "ads_downloaded" | "ads_shared" | "zone_opened" | "signup_started";

/** The welcome card of a business that came from its gift ads. */
export interface ProspectWelcome {
  displayName: string | null;
  kinds: AdKind[];
  zone: ParaZoneTeaser | null;
}
