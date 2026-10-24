"use client";

import Image from "next/image";
import { Clock, Package, Plus, Tag } from "lucide-react";

import { formatPromoLabel } from "@/features/qr/helpers/formatPromoLabel";

import type { QrPromotion } from "@/features/qr/interfaces/promotion";

interface PromoBannerProps {
  promotion: QrPromotion;
  cartListTotal?: number;
  onAddPromotion?: (promotion: QrPromotion) => void;
  className?: string;
}

/** A stable alternative to randomness: promo artwork must not differ on SSR and hydration. */
function stableIndex(value: string, total: number) {
  if (total <= 1) return 0;

  let hash = 0;
  for (let index = 0; index < value.length; index += 1) {
    hash = (hash * 31 + value.charCodeAt(index)) | 0;
  }

  return Math.abs(hash) % total;
}

/**
 * Compact storefront-style promotion card for the narrow table menu. It keeps
 * the visual proof (photo/collage + deal label) while preserving room for a
 * clear, touch-sized action inside a mobile ordering flow.
 */
export function PromoBanner({ promotion, cartListTotal = 0, onAddPromotion, className = "" }: PromoBannerProps) {
  const label = formatPromoLabel(promotion);
  const grouped = promotion.type === "bundle_price" || promotion.type === "nxm";
  const remaining = Math.max(0, Number(promotion.min_amount ?? 0) - cartListTotal);
  const artworkVariant = stableIndex(promotion.id, 3);
  const previewIndex = stableIndex(`${promotion.id}:preview`, promotion.preview_images.length);
  const thumbnail = promotion.image_url ?? promotion.preview_images[previewIndex];
  const usesPackageArtwork = promotion.type === "bundle_price" && !promotion.image_url;
  const availability = remaining > 0 ? "Activa" : promotion.valid_until ? "Vigente" : "Disponible";
  const actionLabel = promotion.type === "nxm"
    ? `Agregar ${promotion.buy_quantity ?? ""}×${promotion.pay_quantity ?? ""}`
    : "Agregar paquete";
  const fallbackDetail = promotion.type === "nxm"
    ? `Lleva ${promotion.buy_quantity ?? ""} y paga ${promotion.pay_quantity ?? ""}`
    : grouped
      ? "Incluye los productos del paquete"
      : "Descuento disponible en este producto";
  const detail = promotion.description?.trim() || fallbackDetail;

  return (
    <section
      className={`flex min-h-36 overflow-hidden rounded-2xl border border-accent/20 bg-surface shadow-sm ${className}`}
      aria-label={`Promoción: ${label}`}
    >
      <div className="relative flex w-28 shrink-0 flex-col overflow-hidden bg-accent p-2.5 text-center text-accent-foreground">
        <span
          aria-hidden
          className={`absolute h-24 w-24 rounded-full bg-white/10 ${
            artworkVariant === 0 ? "-right-9 -top-8" : artworkVariant === 1 ? "-left-10 top-2" : "-right-5 top-7"
          }`}
        />
        {usesPackageArtwork ? (
          <div className="relative z-10 flex h-16 w-16 shrink-0 self-center items-center justify-center rounded-2xl border border-white/25 bg-white/15 shadow-sm">
            <Package className="h-8 w-8 text-white" aria-hidden />
            <span aria-hidden className="absolute -right-1 -top-1 h-4 w-4 rounded-full border-2 border-accent bg-white/90" />
          </div>
        ) : (
          <div
            className={`relative z-10 h-16 w-16 shrink-0 overflow-hidden rounded-xl border-2 border-white/90 bg-white/15 shadow-sm ${
              artworkVariant === 0 ? "self-end rotate-6" : artworkVariant === 1 ? "self-start -rotate-6" : "self-center rotate-3"
            }`}
          >
            {thumbnail ? (
            <Image
              src={thumbnail}
              alt=""
              fill
              loading="lazy"
              sizes="64px"
              className="object-cover"
            />
            ) : (
              <Tag className="absolute inset-0 m-auto h-5 w-5 text-white" aria-hidden />
            )}
          </div>
        )}
        <div className="relative z-10 mt-auto text-left">
          <p className="text-[8px] font-bold uppercase tracking-[0.14em] text-white/75">Oferta</p>
          <p className="line-clamp-2 text-base font-extrabold leading-4 text-white">{label}</p>
        </div>
      </div>

      <div className="flex min-w-0 flex-1 flex-col py-3 pl-3 pr-3">
        <p className="flex items-center gap-1 truncate text-[10px] font-bold leading-3 text-accent">
          <Clock className="h-3.5 w-3.5 shrink-0" aria-hidden />
          {availability}
        </p>
        <p className="mt-1 line-clamp-2 min-h-8 text-sm font-bold leading-4 text-foreground">{promotion.name}</p>
        <p className="mt-1 line-clamp-1 min-h-3.5 text-[10px] leading-3.5 text-muted-foreground">{detail}</p>
        {remaining > 0 ? (
          <div className="mt-auto flex min-h-11 items-center border-t border-border/80 pt-2">
            <p className="line-clamp-2 text-[10px] font-semibold leading-3.5 text-amber-800">
              Agrega ${remaining.toFixed(2)} más para activarla
            </p>
          </div>
        ) : grouped ? (
          <div className="mt-auto flex min-h-11 items-center justify-between gap-3 border-t border-border/80 pt-2">
            <p className="text-[10px] font-semibold leading-3.5 text-muted-foreground">Toca + para agregar</p>
            <button
              type="button"
              onClick={() => onAddPromotion?.(promotion)}
              aria-label={actionLabel}
              className="inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-accent text-accent-foreground shadow-md shadow-accent/25 transition active:scale-[0.94]"
            >
              <Plus className="h-5 w-5" aria-hidden />
            </button>
          </div>
        ) : (
          <div className="mt-auto flex min-h-11 items-center border-t border-border/80 pt-2">
            <p className="text-[10px] font-semibold leading-3.5 text-accent">
              Se descuenta automáticamente al agregar productos
            </p>
          </div>
        )}
      </div>
    </section>
  );
}
