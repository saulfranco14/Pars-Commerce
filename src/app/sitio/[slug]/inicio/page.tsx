import { createAdminClient } from "@/lib/supabase/admin";
import { notFound } from "next/navigation";

interface PageProps {
  params: Promise<{ slug: string }>;
}

export default async function InicioPage({ params }: PageProps) {
  const { slug } = await params;
  const supabase = createAdminClient();

  const { data: tenant, error: tenantError } = await supabase
    .from("tenants")
    .select("id, name, description, theme_color")
    .eq("slug", slug)
    .single();

  if (tenantError || !tenant) {
    notFound();
  }

  const { data: page } = await supabase
    .from("tenant_site_pages")
    .select("content")
    .eq("tenant_id", tenant.id)
    .eq("slug", "inicio")
    .eq("is_enabled", true)
    .single();

  const content = (page?.content as Record<string, string> | null) ?? {};
  const accentColor = tenant.theme_color?.trim() || "#18181b";

  return (
    <div className="space-y-6">
      {(content.hero_image_url || content.title || content.subtitle) && (
        <div
          className="relative overflow-hidden rounded-lg py-12 px-6"
          style={{
            backgroundImage: content.hero_image_url
              ? `url(${content.hero_image_url})`
              : undefined,
            backgroundColor: content.hero_image_url ? "rgba(0,0,0,0.3)" : undefined,
          }}
        >
          <div className="relative z-10">
            {content.title && (
              <h1
                className="text-2xl font-bold sm:text-3xl"
                style={{ color: accentColor }}
              >
                {content.title}
              </h1>
            )}
            {content.subtitle && (
              <p className="mt-2 text-lg text-muted-foreground">
                {content.subtitle}
              </p>
            )}
          </div>
        </div>
      )}

      {content.welcome_text && (
        <div
          className="prose prose-sm max-w-none text-foreground"
          dangerouslySetInnerHTML={{ __html: content.welcome_text }}
        />
      )}

      {!content.title && !content.subtitle && !content.welcome_text && (
        <p className="text-muted-foreground">
          Bienvenido a {tenant.name}. Explora nuestros productos.
        </p>
      )}
    </div>
  );
}
