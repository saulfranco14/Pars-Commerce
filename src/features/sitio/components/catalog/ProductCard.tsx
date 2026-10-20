"use client";

import Image from "next/image";
import Link from "next/link";
import { CalendarClock, Check, Loader2, Package, Plus, RotateCcw, SlidersHorizontal } from "lucide-react";

import { useCartAdd } from "@/features/sitio/hooks/useCartAdd";

import { addItem } from "@/services/publicCartService";
import { formatCurrency } from "@/features/qr/helpers/format";
import { storeFocusRing } from "@/features/sitio/constants/storeClasses";
import { productHref } from "@/features/sitio/helpers/storeLinks";

import type { ProductCardProps } from "@/features/sitio/interfaces/storeComponents";

const ADD_ICONS = { idle: Plus, adding: Loader2, added: Check, error: RotateCcw } as const;
const BADGE = "rounded-full bg-(--store-ink) px-2.5 py-1 text-xs font-semibold text-(--store-canvas)";

export function ProductCard({ product, promotion, tenantId, slug, priority = false, layout = "media" }: ProductCardProps) {
  const href = productHref(slug, product);
  const image = product.image_urls[0] ?? product.image_url;
  const basePrice = Number(product.price);
  const price = promotion?.finalPrice ?? basePrice;
  const discounted = price < basePrice;
  const badge = promotion?.discountPercent
    ? `-${promotion.discountPercent}%`
    : (promotion?.badgeLabel ?? null);
  const isService = product.type === "service";
  const FallbackIcon = isService ? CalendarClock : Package;

  const { status, trigger, ready } = useCartAdd({
    add: (fingerprint) => addItem(tenantId, product.id, 1, fingerprint),
    successLabel: `${product.name} se agregó al carrito`,
  });
  const AddIcon = ADD_ICONS[status];
  const addLabel =
    status === "added"
      ? `${product.name} agregado`
      : status === "error"
        ? `No se pudo agregar ${product.name}, intenta de nuevo`
        : `Agregar ${product.name} al carrito`;

  return (
    <article className="group relative flex h-full flex-col overflow-hidden rounded-(--store-radius) bg-(--store-surface) shadow-sm ring-1 ring-(--store-hairline) transition-[box-shadow,transform] duration-200 hover:shadow-xl motion-safe:hover:-translate-y-1">
      {layout === "text" ? (
        <div className="flex items-center justify-between gap-2 px-3.5 pt-3.5 sm:px-4 sm:pt-4">
          <span className="flex h-10 w-10 items-center justify-center rounded-full bg-(--store-well)">
            <FallbackIcon className="h-5 w-5 text-(--store-ink-2)" aria-hidden />
          </span>
          {badge ? <span className={BADGE}>{badge}</span> : null}
        </div>
      ) : (
        <div className="relative aspect-square overflow-hidden bg-(--store-well)">
          {image ? (
            <Image
              src={image}
              alt={product.name}
              fill
              sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 280px"
              className="object-cover motion-safe:transition-transform motion-safe:duration-500 motion-safe:group-hover:scale-[1.03]"
              priority={priority}
              quality={75}
            />
          ) : (
            <span className="flex h-full items-center justify-center">
              <FallbackIcon className="h-10 w-10 text-(--store-ink-2) opacity-40" aria-hidden />
            </span>
          )}
          {badge ? <span className={`absolute left-3 top-3 ${BADGE}`}>{badge}</span> : null}
        </div>
      )}

      <div className={`flex flex-1 flex-col gap-1 p-3.5 sm:p-4 ${layout === "text" ? "min-h-36" : ""}`}>
        <h3 className="line-clamp-2 text-[15px] font-bold leading-snug text-(--store-ink)">
          <Link
            href={href}
            className={`rounded-sm after:absolute after:inset-0 after:content-[''] ${storeFocusRing}`}
          >
            {product.name}
          </Link>
        </h3>
        {product.description ? (
          <p className="line-clamp-1 text-[13px] text-(--store-ink-2)">{product.description}</p>
        ) : null}

        <div className="mt-auto flex items-end justify-between gap-2 pt-2">
          <p className="min-w-0">
            <span className="block text-lg font-bold tabular-nums text-(--store-ink)">
              {formatCurrency(price)}
            </span>
            {discounted ? (
              <span className="block text-xs tabular-nums text-(--store-ink-2) line-through">
                {formatCurrency(basePrice)}
              </span>
            ) : null}
          </p>

          {product.has_variants ? (
            <Link
              href={href}
              aria-label={`Elegir opciones de ${product.name}`}
              className={`relative z-10 flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-(--store-well) text-(--store-ink) transition-colors hover:bg-accent hover:text-accent-foreground ${storeFocusRing}`}
            >
              <SlidersHorizontal className="h-4.5 w-4.5" aria-hidden />
            </Link>
          ) : (
            <button
              type="button"
              onClick={trigger}
              disabled={!ready || status === "adding"}
              aria-label={addLabel}
              className={`relative z-10 flex h-11 w-11 shrink-0 cursor-pointer items-center justify-center rounded-full bg-accent text-accent-foreground transition-colors hover:bg-accent/90 disabled:cursor-wait disabled:opacity-60 motion-safe:active:scale-95 ${storeFocusRing}`}
            >
              <AddIcon className={`h-5 w-5 ${status === "adding" ? "animate-spin" : ""}`} aria-hidden />
            </button>
          )}
        </div>
      </div>
      <span className="sr-only" aria-live="polite">
        {status === "added" ? `${product.name} agregado al carrito` : ""}
      </span>
    </article>
  );
}
