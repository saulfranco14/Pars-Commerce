"use client";

import Image from "next/image";
import { Clock, Plus, Tag } from "lucide-react";

import { formatPromoLabel } from "@/features/qr/helpers/formatPromoLabel";

import type { QrPromotion } from "@/features/qr/interfaces/promotion";

interface PromoBannerProps {
  promotion: QrPromotion;
  cartListTotal?: number;
  onAddPromotion?: (promotion: QrPromotion) => void;
  className?: string;
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
  const thumbnail = promotion.image_url ?? promotion.preview_images[0];
  const availability = remaining > 0 ? "Activa" : promotion.valid_until ? "Vigente" : "Disponible";
  const actionLabel = promotion.type === "nxm"
    ? `Agregar ${promotion.buy_quantity ?? ""}×${promotion.pay_quantity ?? ""}`
    : "Agregar paquete";

  return (
    <section
      className={`flex min-h-32 overflow-hidden rounded-2xl border border-accent/20 bg-surface shadow-sm ${className}`}
      aria-label={`Promoción: ${label}`}
    >
      <div className="flex w-24 shrink-0 flex-col items-center bg-accent p-2 text-center text-accent-foreground">
        <div className="relative h-16 w-16 shrink-0 overflow-hidden rounded-xl border-2 border-white/90 bg-white/15 shadow-sm">
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
        <p className="mt-auto line-clamp-2 text-[10px] font-extrabold leading-3">{label}</p>
      </div>

      <div className="flex min-w-0 flex-1 flex-col py-3 pr-3">
        <p className="flex items-center gap-1 truncate text-[10px] font-bold leading-3 text-accent">
          <Clock className="h-3.5 w-3.5 shrink-0" aria-hidden />
          {availability}
        </p>
        <p className="mt-1 line-clamp-2 text-sm font-bold leading-4 text-foreground">{promotion.name}</p>
        {remaining > 0 ? (
          <p className="mt-auto line-clamp-2 rounded-lg bg-amber-50 px-2.5 py-2 text-[10px] font-semibold leading-3.5 text-amber-800">
            Agrega ${remaining.toFixed(2)} más para activarla
          </p>
        ) : grouped ? (
          <button
            type="button"
            onClick={() => onAddPromotion?.(promotion)}
            className="mt-auto inline-flex min-h-11 w-fit items-center justify-center gap-1.5 rounded-xl bg-accent px-4 text-xs font-bold text-accent-foreground shadow-sm transition active:scale-[0.98]"
          >
            <Plus className="h-3.5 w-3.5" aria-hidden />
            {actionLabel}
          </button>
        ) : (
          <p className="mt-auto rounded-lg bg-accent/8 px-2.5 py-2 text-[10px] font-semibold leading-3.5 text-accent">
            Se descuenta automáticamente al agregar productos
          </p>
        )}
      </div>
    </section>
  );
}
