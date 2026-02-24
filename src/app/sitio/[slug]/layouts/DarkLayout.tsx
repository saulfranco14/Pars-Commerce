import Link from "next/link";
import { Store } from "lucide-react";
import { WhatsAppIcon } from "@/features/sitio/components/icons/WhatsAppIcon";
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
                    <WhatsAppIcon />
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
