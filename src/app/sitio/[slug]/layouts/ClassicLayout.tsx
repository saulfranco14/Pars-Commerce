import Link from "next/link";
import { Store } from "lucide-react";
import { WhatsAppIcon } from "@/features/sitio/components/icons/WhatsAppIcon";
import { InstagramIcon } from "@/features/sitio/components/icons/InstagramIcon";
import { FacebookIcon } from "@/features/sitio/components/icons/FacebookIcon";
import { TwitterIcon } from "@/features/sitio/components/icons/TwitterIcon";
import SiteHeader from "../SiteHeader";
import { CartProvider } from "../CartProvider";
import type { SiteLayoutProps } from "./layoutTypes";

export function ClassicLayout({
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
        className="h-1 w-full"
        style={{
          background: `linear-gradient(90deg, ${accentColor}, ${accentColor}88, ${accentColor})`,
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
        <main className="mx-auto w-full max-w-6xl flex-1 px-4 py-4 sm:px-6">
          {children}
        </main>
      </CartProvider>
      <footer className="mt-auto border-t border-gray-200 bg-gray-900 text-gray-300">
        <div className="mx-auto max-w-6xl px-4 py-10 sm:px-6">
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
                <p className="mt-2 text-sm text-gray-400">{tenant.description}</p>
              )}
            </div>
            <div>
              <h4 className="mb-3 text-sm font-semibold uppercase tracking-wider text-gray-400">
                Navegación
              </h4>
              <ul className="space-y-2">
                {navPages.map((p) => (
                  <li key={p.id}>
                    <Link
                      href={`/sitio/${tenant.slug}/${p.slug}`}
                      className="text-sm text-gray-400 transition-colors hover:text-white"
                    >
                      {p.title}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
            <div>
              <h4 className="mb-3 text-sm font-semibold uppercase tracking-wider text-gray-400">
                Síguenos
              </h4>
              <div className="flex gap-3">
                {tenant.whatsapp_phone ||
                tenant.social_links?.instagram ||
                tenant.social_links?.facebook ||
                tenant.social_links?.twitter ? (
                  <>
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
                    {tenant.social_links?.instagram && (
                      <a
                        href={tenant.social_links.instagram}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex h-9 w-9 cursor-pointer items-center justify-center rounded-full bg-gray-800 text-gray-400 transition-colors hover:bg-green-600 hover:text-white"
                        aria-label="Instagram"
                      >
                        <InstagramIcon />
                      </a>
                    )}
                    {tenant.social_links?.facebook && (
                      <a
                        href={tenant.social_links.facebook}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex h-9 w-9 cursor-pointer items-center justify-center rounded-full bg-gray-800 text-gray-400 transition-colors hover:bg-green-600 hover:text-white"
                        aria-label="Facebook"
                      >
                        <FacebookIcon />
                      </a>
                    )}
                    {tenant.social_links?.twitter && (
                      <a
                        href={tenant.social_links.twitter}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex h-9 w-9 cursor-pointer items-center justify-center rounded-full bg-gray-800 text-gray-400 transition-colors hover:bg-green-600 hover:text-white"
                        aria-label="Twitter"
                      >
                        <TwitterIcon />
                      </a>
                    )}
                  </>
                ) : (
                  <span className="text-xs text-gray-500">
                    Configura redes en el dashboard
                  </span>
                )}
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
