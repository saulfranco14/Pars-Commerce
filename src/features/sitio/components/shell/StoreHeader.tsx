"use client";

import { Suspense, useEffect, useState } from "react";
import { useBodyScrollLock } from "@/hooks/useBodyScrollLock";
import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Menu, Search, ShoppingBag, Store, X } from "lucide-react";

import { useCartContext } from "@/features/sitio/components/cart/CartProvider";
import { StoreMobileMenu } from "@/features/sitio/components/shell/StoreMobileMenu";
import { StoreNavLinks } from "@/features/sitio/components/shell/StoreNavLinks";
import { StoreSearchPanel } from "@/features/sitio/components/search/StoreSearchPanel";

import { storeFocusRing } from "@/features/sitio/constants/storeClasses";

import type { StoreHeaderProps } from "@/features/sitio/interfaces/storeComponents";

type Panel = "search" | "menu" | null;

const ICON_BUTTON = `relative flex h-11 w-11 shrink-0 cursor-pointer items-center justify-center rounded-full text-(--store-ink) transition-colors hover:bg-(--store-well) ${storeFocusRing}`;

export function StoreHeader({ chrome }: StoreHeaderProps) {
  const pathname = usePathname();
  const { itemsCount } = useCartContext();
  const [panel, setPanel] = useState<Panel>(null);
  const checkoutFocus = pathname.endsWith("/carrito");

  useEffect(() => setPanel(null), [pathname]);

  useBodyScrollLock(Boolean(panel));
  useEffect(() => {
    if (!panel) return;
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") setPanel(null);
    };
    window.addEventListener("keydown", onKey);
    return () => {
      window.removeEventListener("keydown", onKey);
    };
  }, [panel]);

  const toggle = (next: Exclude<Panel, null>) => setPanel((current) => (current === next ? null : next));
  const cartLabel = itemsCount > 0 ? `Carrito, ${itemsCount} ${itemsCount === 1 ? "artículo" : "artículos"}` : "Carrito";

  return (
    <>
      <header className="sticky top-0 z-50 border-b border-(--store-hairline) bg-(--store-surface)/80 backdrop-blur-xl backdrop-saturate-150">
        <div className="mx-auto flex h-14 max-w-6xl items-center gap-2 px-4 sm:px-6">
          <Link
            href={`/sitio/${chrome.slug}`}
            className={`-ml-1 flex min-h-11 min-w-0 items-center gap-2.5 rounded-lg px-1 ${storeFocusRing}`}
          >
            {chrome.logoUrl ? (
              <Image
                src={chrome.logoUrl}
                alt=""
                width={28}
                height={28}
                className="h-7 w-7 shrink-0 rounded-md object-contain"
                priority
              />
            ) : (
              <Store className="h-5 w-5 shrink-0 text-(--store-ink)" aria-hidden />
            )}
            <span className="truncate text-[17px] font-semibold tracking-tight text-(--store-ink)">
              {chrome.tenantName}
            </span>
          </Link>

          {!checkoutFocus ? (
            <>
              <nav aria-label="Secciones de la tienda" className="ml-auto hidden md:block">
                <Suspense fallback={<StoreNavLinks links={chrome.navLinks} />}>
                  <StoreNavLinks links={chrome.navLinks} trackActive />
                </Suspense>
              </nav>
              <div className="ml-auto flex items-center md:ml-2">
                <button
                  type="button"
                  onClick={() => toggle("search")}
                  aria-expanded={panel === "search"}
                  aria-controls="store-search-panel"
                  aria-label={panel === "search" ? "Cerrar búsqueda" : "Buscar"}
                  className={ICON_BUTTON}
                >
                  {panel === "search" ? <X className="h-5 w-5" aria-hidden /> : <Search className="h-5 w-5" aria-hidden />}
                </button>
                <Link href={`/sitio/${chrome.slug}/carrito`} aria-label={cartLabel} className={ICON_BUTTON}>
                  <ShoppingBag className="h-5 w-5" aria-hidden />
                  {itemsCount > 0 ? (
                    <span className="absolute right-0.5 top-0.5 flex h-5 min-w-5 items-center justify-center rounded-full bg-accent px-1 text-[11px] font-semibold tabular-nums text-accent-foreground">
                      {itemsCount > 99 ? "99+" : itemsCount}
                    </span>
                  ) : null}
                </Link>
                <button
                  type="button"
                  onClick={() => toggle("menu")}
                  aria-expanded={panel === "menu"}
                  aria-controls="store-mobile-menu"
                  aria-label={panel === "menu" ? "Cerrar menú" : "Abrir menú"}
                  className={`${ICON_BUTTON} md:hidden`}
                >
                  {panel === "menu" ? <X className="h-5 w-5" aria-hidden /> : <Menu className="h-5 w-5" aria-hidden />}
                </button>
              </div>
            </>
          ) : null}
        </div>
      </header>

      {panel ? (
        <button
          type="button"
          aria-label="Cerrar"
          tabIndex={-1}
          onClick={() => setPanel(null)}
          className="fixed inset-0 top-14 z-40 cursor-default bg-black/25 backdrop-blur-sm"
        />
      ) : null}
      {panel === "search" ? <StoreSearchPanel chrome={chrome} onClose={() => setPanel(null)} /> : null}
      {panel === "menu" ? <StoreMobileMenu chrome={chrome} /> : null}
    </>
  );
}
