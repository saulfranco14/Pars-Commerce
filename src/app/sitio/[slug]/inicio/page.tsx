import { createAdminClient } from "@/lib/supabase/admin";
import { notFound } from "next/navigation";
import Link from "next/link";
import { ArrowRight, ShoppingBag, Sparkles } from "lucide-react";

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
  const accentColor = tenant.theme_color?.trim() || "#6366f1";

  return (
    <div className="space-y-10">
      {/* Hero Section */}
      <section
        className="relative overflow-hidden rounded-2xl shadow-lg"
        style={{
          background: content.hero_image_url
            ? undefined
            : `linear-gradient(135deg, ${accentColor}, ${accentColor}cc, ${accentColor}99)`,
        }}
      >
        {content.hero_image_url && (
          <div
            className="absolute inset-0 bg-cover bg-center"
            style={{ backgroundImage: `url(${content.hero_image_url})` }}
          >
            <div className="absolute inset-0 bg-black/50" />
          </div>
        )}

        <div className="relative z-10 px-8 py-16 sm:px-12 sm:py-24">
          <div className="max-w-2xl">
            {content.title ? (
              <h1 className="text-3xl font-extrabold tracking-tight text-white sm:text-5xl">
                {content.title}
              </h1>
            ) : (
              <h1 className="text-3xl font-extrabold tracking-tight text-white sm:text-5xl">
                Bienvenido a {tenant.name}
              </h1>
            )}

            {content.subtitle ? (
              <p className="mt-4 text-lg text-white/80 sm:text-xl">
                {content.subtitle}
              </p>
            ) : tenant.description ? (
              <p className="mt-4 text-lg text-white/80 sm:text-xl">
                {tenant.description}
              </p>
            ) : null}

            <div className="mt-8 flex flex-wrap gap-4">
              <Link
                href={`/sitio/${slug}/productos`}
                className="inline-flex items-center gap-2 rounded-xl bg-white px-6 py-3 text-sm font-semibold shadow-md transition-all hover:shadow-lg hover:scale-105"
                style={{ color: accentColor }}
              >
                <ShoppingBag className="h-4 w-4" />
                Ver productos
                <ArrowRight className="h-4 w-4" />
              </Link>
              <Link
                href={`/sitio/${slug}/promociones`}
                className="inline-flex items-center gap-2 rounded-xl border-2 border-white/30 bg-white/10 px-6 py-3 text-sm font-semibold text-white backdrop-blur-sm transition-all hover:bg-white/20"
              >
                <Sparkles className="h-4 w-4" />
                Promociones
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Welcome text */}
      {content.welcome_text && (
        <section className="rounded-2xl bg-white p-8 shadow-sm">
          <div
            className="prose prose-sm max-w-none text-gray-700 prose-headings:text-gray-900 prose-a:no-underline"
            style={{
              ["--tw-prose-links" as string]: accentColor,
            }}
            dangerouslySetInnerHTML={{ __html: content.welcome_text }}
          />
        </section>
      )}

      {/* Features / Value propositions */}
      <section className="grid gap-6 sm:grid-cols-3">
        {[
          {
            icon: "🚀",
            title: "Envío rápido",
            desc: "Recibe tus productos en tiempo récord",
          },
          {
            icon: "🛡️",
            title: "Compra segura",
            desc: "Tus datos siempre protegidos",
          },
          {
            icon: "⭐",
            title: "Calidad garantizada",
            desc: "Productos seleccionados para ti",
          },
        ].map((item) => (
          <div
            key={item.title}
            className="rounded-xl bg-white p-6 text-center shadow-sm transition-shadow hover:shadow-md"
          >
            <span className="text-3xl">{item.icon}</span>
            <h3 className="mt-3 font-semibold text-gray-900">{item.title}</h3>
            <p className="mt-1 text-sm text-gray-500">{item.desc}</p>
          </div>
        ))}
      </section>
    </div>
  );
}
