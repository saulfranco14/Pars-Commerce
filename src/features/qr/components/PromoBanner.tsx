"use client";

import Image from "next/image";
import { Clock, Plus } from "lucide-react";

import { formatPromoLabel } from "@/features/qr/helpers/formatPromoLabel";
import { PromotionCollage } from "@/features/promociones/components/PromotionCollage";
import { promotionCollageLabel } from "@/features/promociones/helpers/promotionVisual";

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

  return (
    <section
      className={`overflow-hidden rounded-2xl border border-accent/25 bg-surface shadow-sm ${className}`}
      aria-label={`Promoción: ${label}`}
    >
      <div className="relative aspect-[16/7] overflow-hidden bg-accent">
        {promotion.image_url ? (
          <Image
            src={promotion.image_url}
            alt=""
            fill
            loading="lazy"
            sizes="(max-width: 480px) 50vw, 168px"
            className="object-cover"
          />
        ) : (
          <PromotionCollage
            {...promotionCollageLabel(promotion)}
            images={promotion.preview_images}
          />
        )}
      </div>

      <div className="p-2.5">
        <p className="text-[10px] font-bold text-accent">{label}</p>
        <p className="mt-0.5 line-clamp-2 min-h-8 text-xs font-bold leading-4 text-foreground">{promotion.name}</p>
        <div className="mt-2 flex min-h-11 items-center justify-between gap-1.5">
          {remaining > 0 ? (
            <p className="line-clamp-2 text-[10px] font-semibold leading-3.5 text-amber-700">
              Faltan ${remaining.toFixed(2)}
            </p>
          ) : promotion.valid_until ? (
            <p className="flex items-center gap-1 text-[10px] leading-3.5 text-muted-foreground">
              <Clock className="h-3 w-3 shrink-0" aria-hidden />
              Vigente
            </p>
          ) : (
            <p className="text-[10px] font-semibold text-emerald-700">Disponible</p>
          )}
          {remaining === 0 && grouped ? (
          <button
            type="button"
            onClick={() => onAddPromotion?.(promotion)}
            className="inline-flex min-h-11 shrink-0 items-center gap-1 rounded-full bg-accent px-2.5 text-[10px] font-bold text-accent-foreground shadow-sm transition active:scale-[0.98]"
          >
            <Plus className="h-3 w-3" aria-hidden />
            {promotion.type === "nxm" ? `${promotion.buy_quantity ?? ""}×${promotion.pay_quantity ?? ""}` : "Paquete"}
          </button>
          ) : grouped ? null : (
            <p className="line-clamp-2 text-right text-[10px] font-semibold leading-3.5 text-emerald-700">Automática</p>
          )}
        </div>
      </div>
    </section>
  );
}
