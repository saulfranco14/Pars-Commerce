"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { Store, Menu, X } from "lucide-react";
import CartBadge from "./CartBadge";
import { useCartContext } from "./CartProvider";

interface NavPage {
  id: string;
  slug: string;
  title: string;
}

interface SiteHeaderProps {
  slug: string;
  tenantName: string;
  logoUrl?: string | null;
  accentColor: string;
  navPages: NavPage[];
  tenantId: string;
  variant?: "light" | "dark";
}

export default function SiteHeader({
  slug,
  tenantName,
  logoUrl,
  accentColor,
  navPages,
  tenantId,
  variant = "light",
}: SiteHeaderProps) {
  const isDark = variant === "dark";
  const headerClass = isDark
    ? "sticky top-0 z-50 border-b border-gray-800 bg-gray-900/98 shadow-sm backdrop-blur-sm"
    : "sticky top-0 z-50 border-b border-gray-200/80 bg-white/98 shadow-sm backdrop-blur-sm";
  const navLinkClass = isDark
    ? "text-gray-400 hover:bg-gray-800 hover:text-white"
    : "text-gray-600 hover:bg-gray-100 hover:text-gray-900";
  const menuButtonClass = isDark
    ? "text-gray-400 hover:bg-gray-800 hover:text-white"
    : "text-gray-600 hover:bg-gray-100 hover:text-gray-900";
  const mobilePanelClass = isDark
    ? "bg-gray-900 border-gray-800"
    : "bg-white border-gray-200";
  const mobileLinkClass = isDark
    ? "text-gray-300 hover:bg-gray-800"
    : "text-gray-700 hover:bg-gray-100";
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const { itemsCount } = useCartContext();

  useEffect(() => {
    if (mobileMenuOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [mobileMenuOpen]);

  return (
    <>
      <header className={headerClass}>
        <div className="mx-auto flex max-w-6xl items-center justify-between gap-4 px-4 py-3 sm:px-6">
          <Link
            href={`/sitio/${slug}`}
            className="flex min-h-[44px] shrink-0 cursor-pointer items-center gap-2 text-xl font-bold tracking-tight transition-colors duration-200 hover:opacity-80 focus:outline-none focus:ring-2 focus:ring-offset-2 rounded-lg"
            style={{ color: accentColor }}
          >
            {logoUrl ? (
              <img
                src={logoUrl}
                alt=""
                className="h-8 w-8 shrink-0 object-contain rounded"
              />
            ) : (
              <Store className="h-6 w-6 shrink-0" aria-hidden />
            )}
            <span className="truncate">{tenantName}</span>
          </Link>
          <nav
            className="hidden items-center gap-0.5 md:flex sm:gap-1"
            aria-label="Navegación principal"
          >
            {navPages.map((p) => (
              <Link
                key={p.id}
                href={`/sitio/${slug}/${p.slug}`}
                className={`flex min-h-[44px] min-w-[44px] cursor-pointer items-center justify-center rounded-lg px-3 py-2 text-sm font-medium transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-gray-300 focus:ring-offset-2 ${navLinkClass}`}
              >
                {p.title}
              </Link>
            ))}
            <CartBadge sitioSlug={slug} accentColor={accentColor} />
          </nav>
          <div className="flex items-center gap-1 md:hidden">
            <CartBadge sitioSlug={slug} accentColor={accentColor} />
            <button
              type="button"
              onClick={() => setMobileMenuOpen((o) => !o)}
              className={`flex min-h-[44px] min-w-[44px] cursor-pointer items-center justify-center rounded-lg transition-colors focus:outline-none focus:ring-2 focus:ring-gray-300 focus:ring-offset-2 ${menuButtonClass}`}
              aria-expanded={mobileMenuOpen}
              aria-label={mobileMenuOpen ? "Cerrar menú" : "Abrir menú"}
            >
              {mobileMenuOpen ? (
                <X className="h-6 w-6" aria-hidden />
              ) : (
                <Menu className="h-6 w-6" aria-hidden />
              )}
            </button>
          </div>
        </div>
      </header>
      {mobileMenuOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/20 md:hidden"
          aria-hidden
          onClick={() => setMobileMenuOpen(false)}
        />
      )}
      <div
        className={`fixed top-0 right-0 z-50 h-full w-[min(280px,85vw)] border-l shadow-xl transition-transform duration-200 ease-out md:hidden ${mobilePanelClass} ${
          mobileMenuOpen ? "translate-x-0" : "translate-x-full"
        }`}
        role="dialog"
        aria-label="Menú de navegación"
        aria-modal="true"
      >
        <div className="flex flex-col gap-1 p-4 pt-16">
          {navPages.map((p) => (
            <Link
              key={p.id}
              href={`/sitio/${slug}/${p.slug}`}
              onClick={() => setMobileMenuOpen(false)}
              className={`flex min-h-[48px] cursor-pointer items-center rounded-xl px-4 py-3 text-base font-medium ${mobileLinkClass}`}
            >
              {p.title}
            </Link>
          ))}
          <Link
            href={`/sitio/${slug}/carrito`}
            onClick={() => setMobileMenuOpen(false)}
            className={`mt-2 flex min-h-[48px] cursor-pointer items-center justify-between rounded-xl px-4 py-3 text-base font-medium ${mobileLinkClass}`}
          >
            <span>Carrito</span>
            {itemsCount > 0 && (
              <span
                className="flex h-6 min-w-6 items-center justify-center rounded-full px-2 text-xs font-bold text-white"
                style={{ backgroundColor: accentColor }}
              >
                {itemsCount > 99 ? "99+" : itemsCount}
              </span>
            )}
          </Link>
        </div>
      </div>
    </>
  );
}
