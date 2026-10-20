"use client";

import Link from "next/link";
import { usePathname, useSearchParams } from "next/navigation";

import { storeFocusRing } from "@/features/sitio/constants/storeClasses";
import { isNavLinkActive } from "@/features/sitio/helpers/storeNav";

import type { StoreNavLink } from "@/features/sitio/interfaces/storefront";

function NavList({ links, isActive }: { links: StoreNavLink[]; isActive: (link: StoreNavLink) => boolean }) {
  return (
    <ul className="flex items-center gap-0.5">
      {links.map((link) => {
        const active = isActive(link);
        return (
          <li key={link.id}>
            <Link
              href={link.href}
              aria-current={active ? "page" : undefined}
              className={`flex min-h-11 items-center rounded-full px-3 text-sm transition-colors ${storeFocusRing} ${
                active
                  ? "font-medium text-(--store-ink)"
                  : "text-(--store-ink-2) hover:text-(--store-ink)"
              }`}
            >
              {link.label}
            </Link>
          </li>
        );
      })}
    </ul>
  );
}

function ActiveNavList({ links }: { links: StoreNavLink[] }) {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  return <NavList links={links} isActive={(link) => isNavLinkActive(link.href, pathname, searchParams)} />;
}

export function StoreNavLinks({ links, trackActive = false }: { links: StoreNavLink[]; trackActive?: boolean }) {
  if (trackActive) return <ActiveNavList links={links} />;
  return <NavList links={links} isActive={() => false} />;
}
