"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { CheckCircle2, ShoppingBag } from "lucide-react";

import { MobileActionBar } from "@/components/layout/MobileActionBar";

import { formatCurrency } from "@/features/qr/helpers/format";
import { storeFocusRing } from "@/features/sitio/constants/storeClasses";

import type { StoreCartContextValue } from "@/features/sitio/interfaces/storeCart";

const DESKTOP_TOAST_MS = 4000;

export function CartDock({
  itemsCount,
  subtotal,
  lastAdded,
}: {
  itemsCount: number;
  subtotal: number;
  lastAdded: StoreCartContextValue["lastAdded"];
}) {
  const pathname = usePathname();
  const [toastVisible, setToastVisible] = useState(false);

  useEffect(() => {
    if (!lastAdded) return;
    setToastVisible(true);
    const timer = window.setTimeout(() => setToastVisible(false), DESKTOP_TOAST_MS);
    return () => window.clearTimeout(timer);
  }, [lastAdded]);

  const slug = pathname.match(/^\/sitio\/([^/]+)/)?.[1];
  const isProductDetail = /^\/sitio\/[^/]+\/productos\/[^/]+$/.test(pathname);
  if (!slug || pathname.endsWith("/carrito") || itemsCount === 0) return null;

  const cartHref = `/sitio/${slug}/carrito`;
  const cartLink = (
    <Link
      href={cartHref}
      className={`flex min-h-12 items-center justify-between gap-4 rounded-full bg-accent px-5 text-[15px] font-semibold text-accent-foreground transition-colors hover:bg-accent/90 motion-safe:active:scale-[0.98] ${storeFocusRing}`}
    >
      <span className="flex items-center gap-2">
        <ShoppingBag className="h-4 w-4" aria-hidden />
        Ver carrito ({itemsCount})
      </span>
      <span className="tabular-nums">{formatCurrency(subtotal)}</span>
    </Link>
  );

  return (
    <>
      {!isProductDetail ? (
        <>
          <div className="h-28 md:hidden" aria-hidden />
          <MobileActionBar className="md:hidden" contentClassName="max-w-md">
            <p className="px-2 pb-2 text-xs text-muted-foreground" aria-live="polite">
              {lastAdded?.label ?? `${itemsCount} ${itemsCount === 1 ? "artículo" : "artículos"} en tu carrito`}
            </p>
            {cartLink}
          </MobileActionBar>
        </>
      ) : null}
      {toastVisible && lastAdded ? (
        <div
          role="status"
          className="store-drop-in fixed right-6 top-20 z-50 hidden w-80 rounded-2xl bg-(--store-surface)/95 p-3 shadow-xl ring-1 ring-(--store-hairline) backdrop-blur-xl md:block"
        >
          <p className="mb-2 flex items-center gap-2 px-1 text-sm font-medium text-(--store-ink)">
            <CheckCircle2 className="h-4 w-4 shrink-0 text-emerald-600" aria-hidden />
            <span className="line-clamp-1">{lastAdded.label}</span>
          </p>
          {cartLink}
        </div>
      ) : null}
    </>
  );
}
