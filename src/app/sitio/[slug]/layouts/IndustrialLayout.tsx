import Link from "next/link";
import { Store } from "lucide-react";
import SiteHeader from "../SiteHeader";
import { CartProvider } from "../CartProvider";
import type { SiteLayoutProps } from "./layoutTypes";

export function IndustrialLayout({
  tenant,
  navPages,
  accentColor,
  children,
}: SiteLayoutProps) {
  return (
    <div
      className="flex min-h-screen flex-col bg-slate-100 text-slate-900"
      style={{ ["--accent" as string]: accentColor }}
    >
      <div className="h-0.5 w-full bg-slate-400" />
      <CartProvider tenantId={tenant.id}>
        <SiteHeader
          slug={tenant.slug}
          tenantName={tenant.name}
          logoUrl={tenant.logo_url}
          accentColor={accentColor}
          navPages={navPages}
          tenantId={tenant.id}
        />
        <main className="mx-auto w-full max-w-6xl flex-1 px-4 py-5 sm:px-6">
          {children}
        </main>
      </CartProvider>
      <footer className="mt-auto border-t-2 border-slate-300 bg-slate-200 py-8">
        <div className="mx-auto max-w-6xl px-4 sm:px-6">
          <div className="flex flex-col gap-6 sm:flex-row sm:items-start sm:justify-between">
            <div>
              <Link
                href={`/sitio/${tenant.slug}`}
                className="font-mono text-sm font-bold uppercase tracking-wider"
                style={{ color: accentColor }}
              >
                <Store className="mr-2 inline h-4 w-4" />
                {tenant.name}
              </Link>
              {tenant.description && (
                <p className="mt-2 max-w-xs font-mono text-xs text-slate-600">
                  {tenant.description}
                </p>
              )}
            </div>
            <nav className="flex flex-wrap gap-4 font-mono text-xs uppercase tracking-wider">
              {navPages.map((p) => (
                <Link
                  key={p.id}
                  href={`/sitio/${tenant.slug}/${p.slug}`}
                  className="text-slate-600 transition-colors hover:text-slate-900"
                >
                  {p.title}
                </Link>
              ))}
            </nav>
          </div>
          <div className="mt-6 border-t border-slate-300 pt-4 text-center font-mono text-xs text-slate-500">
            © {new Date().getFullYear()} {tenant.name}
          </div>
        </div>
      </footer>
    </div>
  );
}
