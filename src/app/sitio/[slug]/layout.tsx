import { createAdminClient } from "@/lib/supabase/admin";
import { notFound } from "next/navigation";
import Link from "next/link";
import { ShoppingCart } from "lucide-react";
import SiteCartBadge from "./SiteCartBadge";

interface LayoutProps {
  children: React.ReactNode;
  params: Promise<{ slug: string }>;
}

export default async function SitioLayout({ children, params }: LayoutProps) {
  const { slug } = await params;
  const supabase = createAdminClient();

  const { data: tenant, error: tenantError } = await supabase
    .from("tenants")
    .select("id, name, description, theme_color, slug")
    .eq("slug", slug)
    .single();

  if (tenantError || !tenant) {
    notFound();
  }

  const { data: pages } = await supabase
    .from("tenant_site_pages")
    .select("id, slug, title, position")
    .eq("tenant_id", tenant.id)
    .eq("is_enabled", true)
    .order("position", { ascending: true });

  const navPages = pages ?? [];
  const accentColor = tenant.theme_color?.trim() || "#18181b";

  return (
    <div
      className="min-h-screen bg-surface text-foreground"
      style={{ ["--accent" as string]: accentColor }}
    >
      <header
        className="border-b border-border px-4 py-4"
        style={{ borderColor: accentColor, borderBottomWidth: "2px" }}
      >
        <div className="mx-auto flex max-w-4xl items-center justify-between">
          <Link
            href={`/sitio/${slug}`}
            className="text-xl font-semibold hover:opacity-90"
            style={{ color: accentColor }}
          >
            {tenant.name}
          </Link>
          <nav className="flex items-center gap-4">
            {navPages.map((p) => (
              <Link
                key={p.id}
                href={`/sitio/${slug}/${p.slug}`}
                className="text-sm font-medium hover:opacity-80"
                style={{ color: accentColor }}
              >
                {p.title}
              </Link>
            ))}
            <Link
              href={`/sitio/${slug}/carrito`}
              className="relative flex items-center gap-1 rounded px-2 py-1 text-sm font-medium hover:bg-border-soft"
              style={{ color: accentColor }}
            >
              <ShoppingCart className="h-5 w-5" />
              <SiteCartBadge tenantId={tenant.id} />
            </Link>
          </nav>
        </div>
        {tenant.description && (
          <p className="mx-auto mt-1 max-w-4xl px-4 text-sm text-muted-foreground">
            {tenant.description}
          </p>
        )}
      </header>

      <main className="mx-auto max-w-4xl px-4 py-6">{children}</main>

      <footer className="mt-8 border-t border-border px-4 py-4 text-center text-sm text-muted">
        {tenant.name}
      </footer>
    </div>
  );
}
