"use client";

import Link from "next/link";
import { ChevronLeft, ChevronRight } from "lucide-react";

import { RAIL_MIDDLE_COPY, useCategoryRail } from "@/features/sitio/hooks/useCategoryRail";
import { useStoreNavigation } from "@/features/sitio/hooks/useStoreNavigation";

import {
  storeChip,
  storeChipActive,
  storeChipIdle,
  storeFocusRing,
} from "@/features/sitio/constants/storeClasses";
import { catalogHref } from "@/features/sitio/helpers/storeLinks";

import type { CategoryRailProps } from "@/features/sitio/interfaces/storeCatalog";

const ALL_KEY = "all";
const EDGE_FADE =
  "[mask-image:linear-gradient(to_right,transparent,#000_16px,#000_calc(100%-16px),transparent)] sm:[mask-image:linear-gradient(to_right,transparent_40px,#000_72px,#000_calc(100%-72px),transparent_calc(100%-40px))]";
const ARROW = `absolute top-1/2 z-10 hidden h-9 w-9 -translate-y-1/2 cursor-pointer items-center justify-center rounded-full bg-(--store-surface) text-(--store-ink) shadow-md ring-1 ring-(--store-hairline) transition-transform hover:scale-105 sm:flex ${storeFocusRing}`;

export function CategoryRail({ slug, state, categories }: CategoryRailProps) {
  const { type, subcatalogId, q, sort } = state;
  const { pendingHref } = useStoreNavigation();
  const entries = [
    { key: ALL_KEY, label: "Todas", count: null, href: catalogHref(slug, { type, q, sort }) },
    ...categories.map((category) => ({
      key: category.id,
      label: category.name,
      count: category.count,
      href: catalogHref(slug, { type, subcatalogId: category.id, q, sort }),
    })),
  ];
  // The tapped chip turns active at once; the server catches up behind it.
  const activeKey = entries.find((entry) => entry.href === pendingHref)?.key ?? subcatalogId ?? ALL_KEY;
  const { scrollerRef, looping, copies, onScroll, step } = useCategoryRail(activeKey, entries.length);

  return (
    <nav
      aria-label="Categorías"
      className="sticky top-14 z-30 -mx-4 border-b border-(--store-hairline) bg-(--store-canvas)/90 backdrop-blur-xl sm:-mx-6"
    >
      <div className="relative overflow-hidden">
        {looping ? (
          <button type="button" onClick={() => step(-1)} aria-label="Ver categorías anteriores" className={`${ARROW} left-3`}>
            <ChevronLeft className="h-4 w-4" aria-hidden />
          </button>
        ) : null}
        <div
          ref={scrollerRef}
          onScroll={onScroll}
          // The extra bottom padding pushes the scroll indicator below the clipped edge; on a loop it jumps when the rail wraps.
          className={`relative -mb-5 flex gap-2 overflow-x-auto overscroll-x-contain px-4 pt-3 pb-8 [scrollbar-width:none] sm:px-6 [&::-webkit-scrollbar]:hidden ${looping ? `${EDGE_FADE} sm:px-14` : ""}`}
        >
          {Array.from({ length: copies }, (_, copy) => {
            const isReal = !looping || copy === RAIL_MIDDLE_COPY;
            return entries.map((entry, index) => {
              const active = entry.key === activeKey;
              return (
                <Link
                  key={`${copy}-${entry.key}`}
                  href={entry.href}
                  data-copy={copy}
                  data-active={active}
                  data-copy-start={index === 0 ? "" : undefined}
                  aria-current={isReal && active ? "page" : undefined}
                  aria-hidden={isReal ? undefined : true}
                  tabIndex={isReal ? undefined : -1}
                  className={`${storeChip} gap-1.5 whitespace-nowrap ${active ? storeChipActive : storeChipIdle}`}
                >
                  {entry.label}
                  {entry.count !== null ? (
                    <span className="text-xs font-semibold tabular-nums opacity-60">{entry.count}</span>
                  ) : null}
                </Link>
              );
            });
          })}
        </div>
        {looping ? (
          <button type="button" onClick={() => step(1)} aria-label="Ver más categorías" className={`${ARROW} right-3`}>
            <ChevronRight className="h-4 w-4" aria-hidden />
          </button>
        ) : null}
      </div>
    </nav>
  );
}
