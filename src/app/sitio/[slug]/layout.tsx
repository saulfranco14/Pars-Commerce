import { createAdminClient } from "@/lib/supabase/admin";
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { LayoutSwitcher } from "./layouts/LayoutSwitcher";
import { DEFAULT_TENANT_ACCENT } from "@/features/sitio-web/constants/templateStyles";
import { OrdersClosedNotice } from "@/features/checkout/components/cart/OrdersClosedNotice";
import { getSolutionByDemoSlug } from "@/features/solutions/solutionCatalog";
import { DemoStorePreview } from "@/features/solutions/DemoStorePreview";

interface LayoutProps {
  children: React.ReactNode;
  params: Promise<{ slug: string }>;
}

// Solution pages own the commercial SEO intent. Demo stores are useful for
// visitors but should not compete with their corresponding landing page.
export async function generateMetadata({ params }: Pick<LayoutProps, "params">): Promise<Metadata> {
  const { slug } = await params;
  if (getSolutionByDemoSlug(slug)) return { robots: { index: false, follow: true } };
  return {};
}

export default async function SitioLayout({ children, params }: LayoutProps) {
  const { slug } = await params;
  // Las rutas demo siempre muestran el recorrido comercial, incluso después de
  // crear su tenant real. Así el enlace público explica qué se está viendo en
  // Tlaco y no se vuelve una tienda genérica sin contexto.
  const demoSolution = getSolutionByDemoSlug(slug);
  if (demoSolution) return <DemoStorePreview solution={demoSolution} />;

  const supabase = createAdminClient();

  const { data: tenant, error: tenantError } = await supabase
    .from("tenants")
    .select(
      "id, name, description, logo_url, theme_color, slug, whatsapp_phone, social_links, site_template_id, accepting_orders",
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
  const accentColor = tenant.theme_color?.trim() || DEFAULT_TENANT_ACCENT;

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
      {/* En todas las páginas y no solo en el carrito: si el aviso viviera
          solo en el checkout, el cliente armaría su pedido entero antes de
          enterarse de que no se puede. */}
      {tenant.accepting_orders === false && (
        <div className="mb-4">
          <OrdersClosedNotice businessName={tenant.name} />
        </div>
      )}
      {children}
    </LayoutSwitcher>
  );
}
