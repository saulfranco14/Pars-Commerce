export interface SitePageCard {
  icon?: "heart" | "shield" | "lock" | "gift";
  title?: string;
  description?: string;
}

export interface SitePagePurchaseStep {
  title?: string;
  description?: string;
}

export interface SitePageFaqItem {
  question?: string;
  answer?: string;
}

export interface SitePageContent {
  title?: string;
  subtitle?: string;
  hero_image_url?: string;
  welcome_text?: string;
  body?: string;
  image_url?: string;
  email?: string;
  phone?: string;
  address_text?: string;
  schedule?: string;
  map_embed?: string;
  welcome_message?: string;
  cards?: SitePageCard[];
  purchase_process?: SitePagePurchaseStep[];
  delivery_banner_text?: string;
  faq_items?: SitePageFaqItem[];
}

export interface SitePage {
  id: string;
  slug: string;
  title: string;
  position: number;
  content?: SitePageContent | null;
  is_enabled?: boolean;
}
