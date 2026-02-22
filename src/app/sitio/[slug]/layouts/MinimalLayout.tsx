import Link from "next/link";
import { Store } from "lucide-react";
import SiteHeader from "../SiteHeader";
import { CartProvider } from "../CartProvider";
import type { SiteLayoutProps } from "./layoutTypes";

export function MinimalLayout({
  tenant,
  navPages,
  accentColor,
  children,
}: SiteLayoutProps) {
  return (
    <div
      className="flex min-h-screen flex-col bg-white text-gray-900"
      style={{ ["--accent" as string]: accentColor }}
    >
      <div
        className="h-px w-full opacity-30"
        style={{ backgroundColor: accentColor }}
      />
      <CartProvider tenantId={tenant.id}>
        <SiteHeader
          slug={tenant.slug}
          tenantName={tenant.name}
          logoUrl={tenant.logo_url}
          accentColor={accentColor}
          navPages={navPages}
          tenantId={tenant.id}
        />
        <main className="mx-auto w-full max-w-5xl flex-1 px-4 py-8 sm:px-6 sm:py-12">
          {children}
        </main>
      </CartProvider>
      <footer className="mt-auto border-t border-gray-100 bg-white py-12">
        <div className="mx-auto max-w-5xl px-4 sm:px-6">
          <div className="flex flex-col gap-8 sm:flex-row sm:items-start sm:justify-between">
            <div>
              <Link
                href={`/sitio/${tenant.slug}`}
                className="flex items-center gap-2 text-base font-medium text-gray-900 transition-opacity hover:opacity-70"
                style={{ color: accentColor }}
              >
                <Store className="h-4 w-4 shrink-0" />
                {tenant.name}
              </Link>
              {tenant.description && (
                <p className="mt-2 max-w-xs text-sm text-gray-500">
                  {tenant.description}
                </p>
              )}
            </div>
            <nav className="flex flex-wrap gap-x-6 gap-y-2 text-sm">
              {navPages.map((p) => (
                <Link
                  key={p.id}
                  href={`/sitio/${tenant.slug}/${p.slug}`}
                  className="text-gray-500 transition-colors hover:text-gray-900"
                >
                  {p.title}
                </Link>
              ))}
            </nav>
          </div>
          <div className="mt-8 border-t border-gray-100 pt-6 text-center text-xs text-gray-400">
            © {new Date().getFullYear()} {tenant.name}
          </div>
        </div>
      </footer>
    </div>
  );
}
