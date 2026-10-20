"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { MessageCircle } from "lucide-react";

import { storeButtonSecondary, storeFocusRing } from "@/features/sitio/constants/storeClasses";
import { whatsappHref } from "@/features/sitio/helpers/storeLinks";

import type { StoreChrome } from "@/features/sitio/interfaces/storefront";

export function StoreMobileMenu({ chrome }: { chrome: StoreChrome }) {
  const pathname = usePathname();

  return (
    <nav
      id="store-mobile-menu"
      aria-label="Menú de la tienda"
      className="store-drop-in fixed inset-x-0 top-14 z-50 max-h-[calc(100dvh-3.5rem)] overflow-y-auto border-b border-(--store-hairline) bg-(--store-surface) px-4 pb-8 pt-4 shadow-xl md:hidden"
    >
      <ul>
        {chrome.navLinks.map((link) => {
          const active = pathname === link.href.split("?")[0] && !link.href.includes("?");
          return (
            <li key={link.id}>
              <Link
                href={link.href}
                aria-current={active ? "page" : undefined}
                className={`flex min-h-14 items-center rounded-xl px-2 text-[26px] font-semibold tracking-tight text-(--store-ink) ${storeFocusRing}`}
              >
                {link.label}
              </Link>
            </li>
          );
        })}
      </ul>
      {chrome.whatsappPhone ? (
        <a
          href={whatsappHref(chrome.whatsappPhone)}
          target="_blank"
          rel="noopener noreferrer"
          className={`${storeButtonSecondary} mt-6 w-full`}
        >
          <MessageCircle className="h-4 w-4" aria-hidden />
          Escríbenos por WhatsApp
        </a>
      ) : null}
    </nav>
  );
}
