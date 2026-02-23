import Link from "next/link";
import { Store } from "lucide-react";
import SiteHeader from "../SiteHeader";
import { CartProvider } from "../CartProvider";
import type { SiteLayoutProps } from "./layoutTypes";

export function ElegantLayout({
  tenant,
  navPages,
  accentColor,
  children,
}: SiteLayoutProps) {
  return (
    <div
      className="flex min-h-screen flex-col bg-stone-50 text-stone-800"
      style={{ ["--accent" as string]: accentColor }}
    >
      <div
        className="h-px w-full"
        style={{ backgroundColor: accentColor, opacity: 0.5 }}
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
        <main className="mx-auto w-full max-w-5xl flex-1 px-6 py-10 sm:px-8 sm:py-14">
          {children}
        </main>
      </CartProvider>
      <footer className="mt-auto border-t border-stone-200 bg-white py-12">
        <div className="mx-auto max-w-5xl px-6 sm:px-8">
          <div className="flex flex-col gap-10 sm:flex-row sm:justify-between">
            <div>
              <Link
                href={`/sitio/${tenant.slug}`}
                className="font-serif text-lg font-medium"
                style={{ color: accentColor }}
              >
                <Store className="mr-2 inline h-5 w-5" />
                {tenant.name}
              </Link>
              {tenant.description && (
                <p className="mt-3 max-w-sm text-sm text-stone-500">
                  {tenant.description}
                </p>
              )}
            </div>
            <nav className="flex flex-col gap-2 text-sm text-stone-600">
              {navPages.map((p) => (
                <Link
                  key={p.id}
                  href={`/sitio/${tenant.slug}/${p.slug}`}
                  className="transition-colors hover:text-stone-900"
                >
                  {p.title}
                </Link>
              ))}
            </nav>
          </div>
          <div className="mt-12 border-t border-stone-100 pt-6 text-center text-xs text-stone-400">
            © {new Date().getFullYear()} {tenant.name}
          </div>
        </div>
      </footer>
    </div>
  );
}
