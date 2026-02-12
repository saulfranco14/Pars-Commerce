import { createAdminClient } from "@/lib/supabase/admin";
import { notFound } from "next/navigation";

interface PageProps {
  params: Promise<{ slug: string }>;
}

export default async function NosotrosPage({ params }: PageProps) {
  const { slug } = await params;
  const supabase = createAdminClient();

  const { data: tenant, error: tenantError } = await supabase
    .from("tenants")
    .select("id, name, theme_color")
    .eq("slug", slug)
    .single();

  if (tenantError || !tenant) {
    notFound();
  }

  const { data: page } = await supabase
    .from("tenant_site_pages")
    .select("content")
    .eq("tenant_id", tenant.id)
    .eq("slug", "nosotros")
    .eq("is_enabled", true)
    .single();

  const content = (page?.content as Record<string, string> | null) ?? {};
  const accentColor = tenant.theme_color?.trim() || "#18181b";

  return (
    <div className="space-y-6">
      {content.title && (
        <h2
          className="text-lg font-semibold"
          style={{ color: accentColor }}
        >
          {content.title}
        </h2>
      )}

      {content.image_url && (
        <img
          src={content.image_url}
          alt=""
          className="h-48 w-full rounded-lg object-cover"
        />
      )}

      {content.body && (
        <div
          className="prose prose-sm max-w-none text-foreground"
          dangerouslySetInnerHTML={{ __html: content.body }}
        />
      )}

      {!content.title && !content.body && (
        <p className="text-muted-foreground">
          Próximamente más información sobre nosotros.
        </p>
      )}
    </div>
  );
}
