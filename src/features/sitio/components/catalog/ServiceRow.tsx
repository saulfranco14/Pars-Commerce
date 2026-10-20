"use client";

import Image from "next/image";
import Link from "next/link";
import { CalendarClock, Check, ChevronRight, Loader2, Plus, RotateCcw } from "lucide-react";

import { useCartAdd } from "@/features/sitio/hooks/useCartAdd";

import { addItem } from "@/services/publicCartService";
import { formatCurrency } from "@/features/qr/helpers/format";
import { storeFocusRing } from "@/features/sitio/constants/storeClasses";
import { productHref } from "@/features/sitio/helpers/storeLinks";

import type { ProductCardProps } from "@/features/sitio/interfaces/storeComponents";

const ADD = { idle: { icon: Plus, label: "Agregar" }, adding: { icon: Loader2, label: "Agregando" }, added: { icon: Check, label: "Listo" }, error: { icon: RotateCcw, label: "Reintentar" } } as const;

/** A row of the service price list; `tone` follows the block it sits on. */
export function ServiceRow({
  product,
  promotion,
  tenantId,
  slug,
  tone = "plain",
}: Omit<ProductCardProps, "layout" | "priority"> & { tone?: "plain" | "contrast" }) {
  const href = productHref(slug, product);
  const image = product.image_urls[0] ?? product.image_url;
  const basePrice = Number(product.price);
  const price = promotion?.finalPrice ?? basePrice;
  const { status, trigger, ready } = useCartAdd({
    add: (fingerprint) => addItem(tenantId, product.id, 1, fingerprint),
    successLabel: `${product.name} se agregó al carrito`,
  });
  const { icon: AddIcon, label } = ADD[status];
  const contrast = tone === "contrast";
  const muted = contrast ? "text-(--store-canvas)/65" : "text-(--store-ink-2)";

  return (
    <li className="group relative flex items-center gap-3 py-4 sm:gap-4">
      <span
        className={`relative flex h-14 w-14 shrink-0 items-center justify-center overflow-hidden rounded-2xl ${
          contrast ? "bg-(--store-canvas)/10" : "bg-accent/12"
        }`}
      >
        {image ? (
          <Image src={image} alt="" fill sizes="56px" className="object-cover" />
        ) : (
          <CalendarClock className={`h-6 w-6 ${contrast ? "text-(--store-canvas)/80" : "text-accent"}`} aria-hidden />
        )}
      </span>
      <span className="min-w-0 flex-1">
        <Link
          href={href}
          className={`line-clamp-2 rounded-sm text-[15px] font-bold leading-snug after:absolute after:inset-0 after:content-[''] sm:text-base ${storeFocusRing}`}
        >
          {product.name}
        </Link>
        <span className={`mt-0.5 hidden items-center gap-1.5 text-sm sm:flex ${muted}`}>
          <span className="truncate">{product.description || "Ver detalles"}</span>
          <ChevronRight className="h-3.5 w-3.5 shrink-0" aria-hidden />
        </span>
        <span className="mt-1 flex items-baseline gap-2 sm:hidden">
          <span className="text-base font-bold tabular-nums">{formatCurrency(price)}</span>
          {price < basePrice ? (
            <span className={`text-xs tabular-nums line-through ${muted}`}>{formatCurrency(basePrice)}</span>
          ) : null}
        </span>
      </span>
      <span className="hidden shrink-0 text-right sm:block">
        <span className="block text-lg font-bold tabular-nums">{formatCurrency(price)}</span>
        {price < basePrice ? (
          <span className={`block text-xs tabular-nums line-through ${muted}`}>{formatCurrency(basePrice)}</span>
        ) : null}
      </span>
      <button
        type="button"
        onClick={trigger}
        disabled={!ready || status === "adding"}
        aria-label={`Agregar ${product.name} al carrito`}
        className={`relative z-10 inline-flex h-11 min-w-11 shrink-0 cursor-pointer items-center justify-center gap-1.5 rounded-full bg-accent text-sm font-bold text-accent-foreground transition-colors hover:bg-accent/90 disabled:opacity-60 motion-safe:active:scale-95 sm:px-4 ${storeFocusRing}`}
      >
        <AddIcon className={`h-4 w-4 ${status === "adding" ? "animate-spin" : ""}`} aria-hidden />
        <span className="hidden sm:inline">{label}</span>
      </button>
      <span className="sr-only" aria-live="polite">
        {status === "added" ? `${product.name} agregado al carrito` : ""}
      </span>
    </li>
  );
}
