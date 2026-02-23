import Link from "next/link";
import { Store } from "lucide-react";
import SiteHeader from "../SiteHeader";
import { CartProvider } from "../CartProvider";
import type { SiteLayoutProps } from "./layoutTypes";

export function VibrantLayout({
  tenant,
  navPages,
  accentColor,
  children,
}: SiteLayoutProps) {
  return (
    <div
      className="flex min-h-screen flex-col bg-gray-50 text-gray-900"
      style={{ ["--accent" as string]: accentColor }}
    >
      <div
        className="h-1.5 w-full"
        style={{
          background: `linear-gradient(90deg, ${accentColor}, ${accentColor}dd, ${accentColor}bb, ${accentColor})`,
        }}
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
        <main className="mx-auto w-full max-w-6xl flex-1 px-4 py-6 sm:px-6">
          {children}
        </main>
      </CartProvider>
      <footer
        className="mt-auto py-10"
        style={{
          background: `linear-gradient(180deg, ${accentColor}15 0%, ${accentColor}08 100%)`,
          borderTop: `2px solid ${accentColor}30`,
        }}
      >
        <div className="mx-auto max-w-6xl px-4 sm:px-6">
          <div className="flex flex-wrap items-start justify-between gap-8">
            <div>
              <Link
                href={`/sitio/${tenant.slug}`}
                className="flex items-center gap-2 text-lg font-bold"
                style={{ color: accentColor }}
              >
                <Store className="h-5 w-5" />
                {tenant.name}
              </Link>
              {tenant.description && (
                <p className="mt-2 max-w-sm text-sm text-gray-600">{tenant.description}</p>
              )}
            </div>
            <nav className="flex flex-wrap gap-4">
              {navPages.map((p) => (
                <Link
                  key={p.id}
                  href={`/sitio/${tenant.slug}/${p.slug}`}
                  className="text-sm font-medium text-gray-600 transition-colors hover:text-gray-900"
                  style={{ ["--hover-color" as string]: accentColor }}
                >
                  {p.title}
                </Link>
              ))}
            </nav>
          </div>
          <div
            className="mt-8 border-t pt-6 text-center text-xs"
            style={{ borderColor: `${accentColor}20` }}
          >
            © {new Date().getFullYear()} {tenant.name}
          </div>
        </div>
      </footer>
    </div>
  );
}
