import Link from "next/link";
import { Store } from "lucide-react";
import SiteHeader from "../SiteHeader";
import { CartProvider } from "../CartProvider";
import type { SiteLayoutProps } from "./layoutTypes";

export function BoldLayout({
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
        className="h-2 w-full"
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
        <main className="mx-auto w-full max-w-7xl flex-1 px-4 py-5 sm:px-6 sm:py-6">
          {children}
        </main>
      </CartProvider>
      <footer className="mt-auto border-t-4 bg-gray-900 py-10" style={{ borderColor: accentColor }}>
        <div className="mx-auto max-w-7xl px-4 sm:px-6">
          <div className="flex flex-wrap items-start justify-between gap-8">
            <div>
              <Link
                href={`/sitio/${tenant.slug}`}
                className="flex items-center gap-2 text-xl font-bold text-white"
              >
                <Store className="h-6 w-6" style={{ color: accentColor }} />
                {tenant.name}
              </Link>
              {tenant.description && (
                <p className="mt-2 max-w-xs text-sm text-gray-400">{tenant.description}</p>
              )}
            </div>
            <nav className="flex flex-wrap gap-6">
              {navPages.map((p) => (
                <Link
                  key={p.id}
                  href={`/sitio/${tenant.slug}/${p.slug}`}
                  className="text-sm font-semibold text-gray-400 transition-colors hover:text-white"
                >
                  {p.title}
                </Link>
              ))}
            </nav>
          </div>
          <div className="mt-8 border-t border-gray-800 pt-6 text-center text-xs text-gray-500">
            © {new Date().getFullYear()} {tenant.name}
          </div>
        </div>
      </footer>
    </div>
  );
}
