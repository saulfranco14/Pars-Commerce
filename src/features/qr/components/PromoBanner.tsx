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

  return (
    <section
      className={`flex min-h-[6.5rem] overflow-hidden rounded-xl border border-accent/20 bg-surface shadow-sm ${className}`}
      aria-label={`Promoción: ${label}`}
    >
      <div className="relative m-1.5 h-12 w-12 shrink-0 self-start overflow-hidden rounded-lg bg-accent/10">
        {thumbnail ? (
          <Image
            src={thumbnail}
            alt=""
            fill
            loading="lazy"
            sizes="48px"
            className="object-cover"
          />
        ) : (
          <Tag className="absolute inset-0 m-auto h-5 w-5 text-accent" aria-hidden />
        )}
      </div>

      <div className="flex min-w-0 flex-1 flex-col py-2 pr-2">
        <p className="truncate text-[9px] font-bold leading-3 text-accent">{label}</p>
        <p className="mt-0.5 line-clamp-2 text-[11px] font-bold leading-3.5 text-foreground">{promotion.name}</p>
        <div className="mt-auto flex min-h-11 items-center justify-between gap-1">
          {remaining > 0 ? (
            <p className="line-clamp-2 text-[9px] font-semibold leading-3 text-amber-700">
              Faltan ${remaining.toFixed(2)}
            </p>
          ) : promotion.valid_until ? (
            <p className="flex min-w-0 items-center gap-1 truncate text-[9px] leading-3 text-muted-foreground">
              <Clock className="h-3 w-3 shrink-0" aria-hidden />
              Vigente
            </p>
          ) : (
            <p className="text-[9px] font-semibold text-emerald-700">Disponible</p>
          )}
          {remaining === 0 && grouped ? (
          <button
            type="button"
            onClick={() => onAddPromotion?.(promotion)}
            className="inline-flex min-h-11 shrink-0 items-center gap-1 rounded-full bg-accent px-2.5 text-[9px] font-bold text-accent-foreground shadow-sm transition active:scale-[0.98]"
          >
            <Plus className="h-3 w-3" aria-hidden />
            {promotion.type === "nxm" ? `${promotion.buy_quantity ?? ""}×${promotion.pay_quantity ?? ""}` : "Paquete"}
          </button>
          ) : grouped ? null : (
            <p className="truncate text-right text-[9px] font-semibold leading-3 text-emerald-700">Automática</p>
          )}
        </div>
      </div>
    </section>
  );
}
