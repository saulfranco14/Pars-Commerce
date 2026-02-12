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
}

export interface SitePage {
  id: string;
  slug: string;
  title: string;
  position: number;
  content?: SitePageContent | null;
  is_enabled?: boolean;
}
