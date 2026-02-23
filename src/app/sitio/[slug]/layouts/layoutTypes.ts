export interface LayoutTenant {
  id: string;
  name: string;
  description: string | null;
  logo_url: string | null;
  theme_color: string | null;
  slug: string;
  whatsapp_phone: string | null;
  social_links: Record<string, string> | null;
}

export interface LayoutNavPage {
  id: string;
  slug: string;
  title: string;
}

export interface SiteLayoutProps {
  tenant: LayoutTenant;
  navPages: LayoutNavPage[];
  accentColor: string;
  children: React.ReactNode;
}
