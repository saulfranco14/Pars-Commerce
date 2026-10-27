export type ParaLinkEvent = "para_viewed" | "para_seconds" | "claim_clicked" | "help_clicked";

export interface ParaItem {
  name: string;
  price: number;
  imageUrl: string | null;
  type: "product" | "service";
}

export interface ParaPageData {
  businessName: string;
  giroLabel: string;
  place: string;
  items: ParaItem[];
  claimUrl: string;
  helpUrl: string | null;
}
