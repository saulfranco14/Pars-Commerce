import Link from "next/link";
import { Store } from "lucide-react";
import SiteHeader from "../SiteHeader";
import { CartProvider } from "../CartProvider";
import type { SiteLayoutProps } from "./layoutTypes";

export function DarkLayout({
  tenant,
  navPages,
  accentColor,
  children,
}: SiteLayoutProps) {
  return (
    <div
      className="flex min-h-screen flex-col bg-gray-950 text-gray-100"
      style={{ ["--accent" as string]: accentColor }}
    >
      <div
        className="h-1 w-full opacity-80"
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
          variant="dark"
        />
        <main className="mx-auto w-full max-w-6xl flex-1 px-4 py-6 sm:px-6">
          {children}
        </main>
      </CartProvider>
      <footer className="mt-auto border-t border-gray-800 bg-gray-900 py-10">
        <div className="mx-auto max-w-6xl px-4 sm:px-6">
          <div className="grid gap-8 sm:grid-cols-3">
            <div>
              <Link
                href={`/sitio/${tenant.slug}`}
                className="flex items-center gap-2 text-lg font-bold text-white"
              >
                <Store className="h-5 w-5" style={{ color: accentColor }} />
                {tenant.name}
              </Link>
              {tenant.description && (
                <p className="mt-2 text-sm text-gray-500">{tenant.description}</p>
              )}
            </div>
            <div>
              <h4 className="mb-3 text-xs font-semibold uppercase tracking-wider text-gray-500">
                Navegación
              </h4>
              <ul className="space-y-2">
                {navPages.map((p) => (
                  <li key={p.id}>
                    <Link
                      href={`/sitio/${tenant.slug}/${p.slug}`}
                      className="text-sm text-gray-500 transition-colors hover:text-white"
                    >
                      {p.title}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
            <div>
              <h4 className="mb-3 text-xs font-semibold uppercase tracking-wider text-gray-500">
                Contacto
              </h4>
              <div className="flex gap-2">
                {tenant.whatsapp_phone && (
                  <a
                    href={`https://wa.me/${tenant.whatsapp_phone.replace(/\D/g, "")}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex h-9 w-9 cursor-pointer items-center justify-center rounded-full bg-gray-800 text-gray-400 transition-colors hover:bg-green-600 hover:text-white"
                    aria-label="WhatsApp"
                  >
                    <svg className="h-4 w-4" fill="currentColor" viewBox="0 0 24 24" aria-hidden>
                      <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
                    </svg>
                  </a>
                )}
              </div>
            </div>
          </div>
          <div className="mt-8 border-t border-gray-800 pt-6 text-center text-xs text-gray-600">
            © {new Date().getFullYear()} {tenant.name}
          </div>
        </div>
      </footer>
    </div>
  );
}
