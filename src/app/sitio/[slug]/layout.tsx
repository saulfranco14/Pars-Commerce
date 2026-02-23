import { createAdminClient } from "@/lib/supabase/admin";
import { notFound } from "next/navigation";
import { LayoutSwitcher } from "./layouts/LayoutSwitcher";

interface LayoutProps {
  children: React.ReactNode;
  params: Promise<{ slug: string }>;
}

export default async function SitioLayout({ children, params }: LayoutProps) {
  const { slug } = await params;
  const supabase = createAdminClient();

  const { data: tenant, error: tenantError } = await supabase
    .from("tenants")
    .select(
      "id, name, description, logo_url, theme_color, slug, whatsapp_phone, social_links, site_template_id",
    )
    .eq("slug", slug)
    .single();

  if (tenantError || !tenant) {
    notFound();
  }

  let layoutVariant = "classic";
  if (tenant.site_template_id) {
    const { data: template } = await supabase
      .from("site_templates")
      .select("layout_variant")
      .eq("id", tenant.site_template_id)
      .single();
    if (template?.layout_variant) {
      layoutVariant = template.layout_variant;
    }
  }

  const { data: pages } = await supabase
    .from("tenant_site_pages")
    .select("id, slug, title, position")
    .eq("tenant_id", tenant.id)
    .eq("is_enabled", true)
    .order("position", { ascending: true });

  const navPages = pages ?? [];
  const accentColor = tenant.theme_color?.trim() || "#6366f1";

  const layoutTenant = {
    id: tenant.id,
    name: tenant.name,
    description: tenant.description,
    logo_url: tenant.logo_url,
    theme_color: tenant.theme_color,
    slug: tenant.slug,
    whatsapp_phone: tenant.whatsapp_phone,
    social_links: (tenant.social_links as Record<string, string> | null) ?? {},
  };

  return (
    <LayoutSwitcher
      layoutVariant={layoutVariant}
      tenant={layoutTenant}
      navPages={navPages}
      accentColor={accentColor}
    >
      {children}
    </LayoutSwitcher>
  );
}
