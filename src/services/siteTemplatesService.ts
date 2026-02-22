import { apiFetch } from "@/services/apiFetch";

export interface SiteTemplate {
  id: string;
  slug: string;
  name: string;
  description: string | null;
  preview_image_url: string | null;
  layout_variant: string;
  default_theme_color: string | null;
  config: Record<string, unknown>;
  sort_order: number;
}

export async function list(): Promise<SiteTemplate[]> {
  const data = await apiFetch("/api/site-templates");
  return Array.isArray(data) ? (data as SiteTemplate[]) : [];
}
