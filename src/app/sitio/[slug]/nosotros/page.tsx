import { createAdminClient } from "@/lib/supabase/admin";
import { notFound } from "next/navigation";
import { Users, Heart } from "lucide-react";

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
  const accentColor = tenant.theme_color?.trim() || "#6366f1";

  return (
    <div className="space-y-8">
      {/* Page header */}
      <div className="flex items-center gap-3">
        <div
          className="flex h-10 w-10 items-center justify-center rounded-xl text-white"
          style={{ backgroundColor: accentColor }}
        >
          <Users className="h-5 w-5" />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-gray-900">
            {content.title || "Nosotros"}
          </h1>
          <p className="text-sm text-gray-500">Conoce más sobre nosotros</p>
        </div>
      </div>

      {/* Image banner */}
      {content.image_url && (
        <div className="overflow-hidden rounded-2xl shadow-sm">
          <img
            src={content.image_url}
            alt={content.title || "Nosotros"}
            className="h-64 w-full object-cover sm:h-80"
          />
        </div>
      )}

      {/* Body content */}
      {content.body ? (
        <div className="rounded-2xl bg-white p-8 shadow-sm">
          <div
            className="prose prose-sm max-w-none text-gray-700 prose-headings:text-gray-900"
            style={{
              ["--tw-prose-links" as string]: accentColor,
            }}
            dangerouslySetInnerHTML={{ __html: content.body }}
          />
        </div>
      ) : (
        !content.title &&
        !content.image_url && (
          <div className="rounded-2xl bg-white py-16 text-center shadow-sm">
            <Heart className="mx-auto h-12 w-12 text-gray-300" />
            <p className="mt-4 text-gray-500">
              Próximamente más información sobre nosotros.
            </p>
          </div>
        )
      )}
    </div>
  );
}
