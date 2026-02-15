import { createAdminClient } from "@/lib/supabase/admin";
import { notFound } from "next/navigation";
import Link from "next/link";
import {
  ShoppingCart,
  Store,
  Globe,
  Heart,
  Mail,
} from "lucide-react";
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
  const accentColor = tenant.theme_color?.trim() || "#6366f1";

  return (
    <div
      className="flex min-h-screen flex-col bg-gray-50 text-gray-900"
      style={{ ["--accent" as string]: accentColor }}
    >
      {/* Top accent bar */}
      <div
        className="h-1 w-full"
        style={{
          background: `linear-gradient(90deg, ${accentColor}, ${accentColor}88, ${accentColor})`,
        }}
      />

      {/* Header */}
      <header className="sticky top-0 z-50 border-b border-gray-200 bg-white/95 backdrop-blur-md shadow-sm">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-3 sm:px-6">
          {/* Logo / Brand */}
          <Link
            href={`/sitio/${slug}`}
            className="flex items-center gap-2 text-xl font-bold tracking-tight transition-transform hover:scale-105"
            style={{ color: accentColor }}
          >
            <Store className="h-6 w-6" />
            {tenant.name}
          </Link>

          {/* Navigation */}
          <nav className="flex items-center gap-1">
            {navPages.map((p) => (
              <Link
                key={p.id}
                href={`/sitio/${slug}/${p.slug}`}
                className="relative rounded-lg px-3 py-2 text-sm font-medium text-gray-600 transition-all hover:bg-gray-100 hover:text-gray-900"
              >
                {p.title}
              </Link>
            ))}
            <Link
              href={`/sitio/${slug}/carrito`}
              className="relative ml-2 flex items-center gap-1 rounded-lg px-3 py-2 text-sm font-medium text-white transition-all hover:opacity-90 hover:shadow-md"
              style={{ backgroundColor: accentColor }}
            >
              <ShoppingCart className="h-4 w-4" />
              <SiteCartBadge tenantId={tenant.id} />
            </Link>
          </nav>
        </div>
      </header>

      {/* Main content */}
      <main className="mx-auto w-full max-w-6xl flex-1 px-4 py-8 sm:px-6">
        {children}
      </main>

      {/* Footer */}
      <footer
        className="mt-auto border-t border-gray-200 bg-gray-900 text-gray-300"
      >
        <div className="mx-auto max-w-6xl px-4 py-10 sm:px-6">
          <div className="grid gap-8 sm:grid-cols-3">
            {/* Brand column */}
            <div>
              <Link
                href={`/sitio/${slug}`}
                className="flex items-center gap-2 text-lg font-bold text-white"
              >
                <Store className="h-5 w-5" style={{ color: accentColor }} />
                {tenant.name}
              </Link>
              {tenant.description && (
                <p className="mt-2 text-sm text-gray-400">
                  {tenant.description}
                </p>
              )}
            </div>

            {/* Quick links */}
            <div>
              <h4 className="mb-3 text-sm font-semibold uppercase tracking-wider text-gray-400">
                Navegación
              </h4>
              <ul className="space-y-2">
                {navPages.map((p) => (
                  <li key={p.id}>
                    <Link
                      href={`/sitio/${slug}/${p.slug}`}
                      className="text-sm text-gray-400 transition-colors hover:text-white"
                    >
                      {p.title}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>

            {/* Social / Contact */}
            <div>
              <h4 className="mb-3 text-sm font-semibold uppercase tracking-wider text-gray-400">
                Síguenos
              </h4>
              <div className="flex gap-3">
                <span className="flex h-9 w-9 items-center justify-center rounded-full bg-gray-800 text-gray-400 transition-colors hover:text-white">
                  <Globe className="h-4 w-4" />
                </span>
                <span className="flex h-9 w-9 items-center justify-center rounded-full bg-gray-800 text-gray-400 transition-colors hover:text-white">
                  <Heart className="h-4 w-4" />
                </span>
                <span className="flex h-9 w-9 items-center justify-center rounded-full bg-gray-800 text-gray-400 transition-colors hover:text-white">
                  <Mail className="h-4 w-4" />
                </span>
              </div>
            </div>
          </div>

          <div className="mt-8 border-t border-gray-800 pt-6 text-center text-xs text-gray-500">
            © {new Date().getFullYear()} {tenant.name}. Todos los derechos
            reservados.
          </div>
        </div>
      </footer>
    </div>
  );
}
