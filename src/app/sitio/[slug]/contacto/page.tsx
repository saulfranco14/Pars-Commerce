import { createAdminClient } from "@/lib/supabase/admin";
import { notFound } from "next/navigation";

interface PageProps {
  params: Promise<{ slug: string }>;
}

export default async function ContactoPage({ params }: PageProps) {
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
    .eq("slug", "contacto")
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

      {content.welcome_message && (
        <div
          className="prose prose-sm max-w-none text-foreground"
          dangerouslySetInnerHTML={{ __html: content.welcome_message }}
        />
      )}

      <div className="space-y-2">
        {content.email && (
          <p className="text-sm">
            <span className="font-medium text-foreground">Email: </span>
            <a
              href={`mailto:${content.email}`}
              className="underline"
              style={{ color: accentColor }}
            >
              {content.email}
            </a>
          </p>
        )}
        {content.phone && (
          <p className="text-sm">
            <span className="font-medium text-foreground">Teléfono: </span>
            <a
              href={`tel:${content.phone}`}
              className="underline"
              style={{ color: accentColor }}
            >
              {content.phone}
            </a>
          </p>
        )}
        {content.address_text && (
          <p className="text-sm">
            <span className="font-medium text-foreground">Dirección: </span>
            <span className="text-muted-foreground">{content.address_text}</span>
          </p>
        )}
        {content.schedule && (
          <p className="text-sm">
            <span className="font-medium text-foreground">Horario: </span>
            <span className="text-muted-foreground">{content.schedule}</span>
          </p>
        )}
      </div>

      {content.map_embed && (
        <div
          className="mt-4 overflow-hidden rounded-lg"
          dangerouslySetInnerHTML={{ __html: content.map_embed }}
        />
      )}

      {!content.email && !content.phone && (
        <p className="text-muted-foreground">
          Próximamente información de contacto.
        </p>
      )}
    </div>
  );
}
