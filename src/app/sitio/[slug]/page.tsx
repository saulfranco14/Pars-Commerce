import { createAdminClient } from "@/lib/supabase/admin";
import { notFound } from "next/navigation";

interface PageProps {
  params: Promise<{ slug: string }>;
}

export default async function SitioPublicoPage({ params }: PageProps) {
  const { slug } = await params;
  const supabase = createAdminClient();

  const { data: tenant, error: tenantError } = await supabase
    .from("tenants")
    .select("id, name, description, theme_color, slug")
    .eq("slug", slug)
    .eq("public_store_enabled", true)
    .single();

  if (tenantError || !tenant) {
    notFound();
  }

  const [pagesRes, productsRes] = await Promise.all([
    supabase
      .from("tenant_site_pages")
      .select("id, slug, title, position")
      .eq("tenant_id", tenant.id)
      .order("position", { ascending: true }),
    supabase
      .from("products")
      .select("id, name, slug, description, price, image_url, type")
      .eq("tenant_id", tenant.id)
      .eq("is_public", true)
      .order("created_at", { ascending: false }),
  ]);

  const pages = pagesRes.data ?? [];
  const products = productsRes.data ?? [];

  const accentColor = tenant.theme_color?.trim() || "#18181b";

  return (
    <div
      className="min-h-screen bg-white text-zinc-900"
      style={{ ["--accent" as string]: accentColor }}
    >
      <header
        className="border-b border-zinc-200 px-4 py-4"
        style={{ borderColor: accentColor, borderBottomWidth: "2px" }}
      >
        <h1 className="text-xl font-semibold" style={{ color: accentColor }}>
          {tenant.name}
        </h1>
        {tenant.description && (
          <p className="mt-1 text-sm text-zinc-600">{tenant.description}</p>
        )}
      </header>

      <nav className="flex flex-wrap gap-2 border-b border-zinc-200 px-4 py-3">
        {pages.map((p) => (
          <a
            key={p.id}
            href={`#${p.slug}`}
            className="rounded px-2 py-1 text-sm font-medium hover:bg-zinc-100"
            style={{ color: accentColor }}
          >
            {p.title}
          </a>
        ))}
      </nav>

      <main className="mx-auto max-w-4xl px-4 py-6">
        {pages.map((p) => (
          <section
            key={p.id}
            id={p.slug}
            className="scroll-mt-4 border-b border-zinc-100 pb-6 last:border-0"
          >
            <h2
              className="text-lg font-semibold"
              style={{ color: accentColor }}
            >
              {p.title}
            </h2>
            {p.slug === "productos" && products.length > 0 && (
              <ul className="mt-3 grid gap-4 sm:grid-cols-2">
                {products.map((item) => (
                  <li
                    key={item.id}
                    className="rounded-lg border border-zinc-200 p-3"
                  >
                    {item.image_url && (
                      <img
                        src={item.image_url}
                        alt=""
                        className="mb-2 h-24 w-full rounded object-cover"
                      />
                    )}
                    <p className="font-medium text-zinc-900">{item.name}</p>
                    {item.description && (
                      <p className="mt-1 text-sm text-zinc-600 line-clamp-2">
                        {item.description}
                      </p>
                    )}
                    <p
                      className="mt-2 text-sm font-semibold"
                      style={{ color: accentColor }}
                    >
                      ${Number(item.price).toFixed(2)}
                    </p>
                  </li>
                ))}
              </ul>
            )}
            {p.slug === "productos" && products.length === 0 && (
              <p className="mt-2 text-sm text-zinc-500">
                No hay productos públicos en el catálogo.
              </p>
            )}
          </section>
        ))}
      </main>

      <footer className="mt-8 border-t border-zinc-200 px-4 py-4 text-center text-sm text-zinc-500">
        {tenant.name}
      </footer>
    </div>
  );
}
