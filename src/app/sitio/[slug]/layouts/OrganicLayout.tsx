import Link from "next/link";
import { Store } from "lucide-react";
import SiteHeader from "../SiteHeader";
import { CartProvider } from "../CartProvider";
import type { SiteLayoutProps } from "./layoutTypes";

export function OrganicLayout({
  tenant,
  navPages,
  accentColor,
  children,
}: SiteLayoutProps) {
  return (
    <div
      className="flex min-h-screen flex-col bg-amber-50/50 text-stone-800"
      style={{ ["--accent" as string]: accentColor }}
    >
      <div
        className="h-1 w-full rounded-b-full opacity-60"
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
        <main className="mx-auto w-full max-w-6xl flex-1 px-4 py-6 sm:px-6 sm:py-8">
          {children}
        </main>
      </CartProvider>
      <footer className="mt-auto border-t border-amber-200/80 bg-amber-100/50 py-10">
        <div className="mx-auto max-w-6xl px-4 sm:px-6">
          <div className="grid gap-8 sm:grid-cols-3">
            <div className="rounded-3xl bg-white/60 p-6">
              <Link
                href={`/sitio/${tenant.slug}`}
                className="flex items-center gap-2 text-lg font-semibold"
                style={{ color: accentColor }}
              >
                <Store className="h-5 w-5 shrink-0" />
                {tenant.name}
              </Link>
              {tenant.description && (
                <p className="mt-2 text-sm text-stone-600">{tenant.description}</p>
              )}
            </div>
            <div>
              <h4 className="mb-3 text-sm font-medium text-stone-600">Navegación</h4>
              <ul className="space-y-2">
                {navPages.map((p) => (
                  <li key={p.id}>
                    <Link
                      href={`/sitio/${tenant.slug}/${p.slug}`}
                      className="text-sm text-stone-600 transition-colors hover:text-stone-900"
                    >
                      {p.title}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          </div>
          <div className="mt-8 border-t border-amber-200/60 pt-6 text-center text-xs text-stone-500">
            © {new Date().getFullYear()} {tenant.name}
          </div>
        </div>
      </footer>
    </div>
  );
}
