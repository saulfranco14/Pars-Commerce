import Link from "next/link";
import { Store } from "lucide-react";
import { WhatsAppIcon } from "@/features/sitio/components/icons/WhatsAppIcon";
import { InstagramIcon } from "@/features/sitio/components/icons/InstagramIcon";
import SiteHeader from "../SiteHeader";
import { CartProvider } from "../CartProvider";
import type { SiteLayoutProps } from "./layoutTypes";

export function BentoLayout({
  tenant,
  navPages,
  accentColor,
  children,
}: SiteLayoutProps) {
  return (
    <div
      className="flex min-h-screen flex-col bg-gray-100 text-gray-900"
      style={{ ["--accent" as string]: accentColor }}
    >
      <div
        className="h-0.5 w-full"
        style={{
          background: `linear-gradient(90deg, transparent, ${accentColor}40, transparent)`,
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
        <main className="mx-auto w-full max-w-7xl flex-1 px-4 py-6 sm:px-6 sm:py-8">
          {children}
        </main>
      </CartProvider>
      <footer className="mt-auto border-t border-gray-200 bg-white">
        <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6">
          <div className="grid gap-10 sm:grid-cols-3">
            <div className="rounded-2xl bg-gray-50 p-6">
              <Link
                href={`/sitio/${tenant.slug}`}
                className="flex items-center gap-2 text-lg font-semibold"
                style={{ color: accentColor }}
              >
                <Store className="h-5 w-5 shrink-0" />
                {tenant.name}
              </Link>
              {tenant.description && (
                <p className="mt-3 text-sm text-gray-600">
                  {tenant.description}
                </p>
              )}
            </div>
            <div className="rounded-2xl bg-gray-50 p-6">
              <h4 className="text-xs font-semibold uppercase tracking-wider text-gray-500">
                Navegación
              </h4>
              <ul className="mt-3 space-y-2">
                {navPages.map((p) => (
                  <li key={p.id}>
                    <Link
                      href={`/sitio/${tenant.slug}/${p.slug}`}
                      className="text-sm text-gray-600 transition-colors hover:text-gray-900"
                    >
                      {p.title}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
            <div className="rounded-2xl bg-gray-50 p-6">
              <h4 className="text-xs font-semibold uppercase tracking-wider text-gray-500">
                Contacto
              </h4>
              <div className="mt-3 flex gap-2">
                {tenant.whatsapp_phone && (
                  <a
                    href={`https://wa.me/${tenant.whatsapp_phone.replace(/\D/g, "")}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex h-9 w-9 cursor-pointer items-center justify-center rounded-xl bg-gray-200 text-gray-600 transition-colors hover:bg-green-100 hover:text-green-700"
                    aria-label="WhatsApp"
                  >
                    <WhatsAppIcon />
                  </a>
                )}
                {tenant.social_links?.instagram && (
                  <a
                    href={tenant.social_links.instagram}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex h-9 w-9 cursor-pointer items-center justify-center rounded-xl bg-gray-200 text-gray-600 transition-colors hover:bg-pink-100 hover:text-pink-600"
                    aria-label="Instagram"
                  >
                    <InstagramIcon />
                  </a>
                )}
              </div>
            </div>
          </div>
          <div className="mt-10 border-t border-gray-200 pt-6 text-center text-xs text-gray-500">
            © {new Date().getFullYear()} {tenant.name}
          </div>
        </div>
      </footer>
    </div>
  );
}
