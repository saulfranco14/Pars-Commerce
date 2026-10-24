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
      <div className="relative aspect-[16/8] overflow-hidden bg-accent">
        {promotion.image_url ? (
          <Image
            src={promotion.image_url}
            alt=""
            fill
            loading="lazy"
            sizes="(max-width: 480px) calc(100vw - 40px), 360px"
            className="object-cover"
          />
        ) : (
          <PromotionCollage
            {...promotionCollageLabel(promotion)}
            images={promotion.preview_images}
          />
        )}
      </div>

      <div className="p-3.5">
        <p className="text-xs font-bold text-accent">{label}</p>
        <p className="mt-0.5 text-sm font-bold leading-snug text-foreground">{promotion.name}</p>
        {promotion.description && (
          <p className="mt-1 line-clamp-2 text-xs leading-5 text-muted-foreground">
            {promotion.description}
          </p>
        )}
        <div className="mt-3 flex min-h-11 items-center justify-between gap-3">
          {remaining > 0 ? (
            <p className="text-xs font-semibold leading-4 text-amber-700">
              Agrega ${remaining.toFixed(2)} para activarla
            </p>
          ) : promotion.valid_until ? (
            <p className="flex items-center gap-1 text-xs text-muted-foreground">
              <Clock className="h-3.5 w-3.5" aria-hidden />
              Vigente por tiempo limitado
            </p>
          ) : (
            <p className="text-xs font-semibold text-emerald-700">Disponible ahora</p>
          )}
          {remaining === 0 && grouped ? (
          <button
            type="button"
            onClick={() => onAddPromotion?.(promotion)}
            className="inline-flex min-h-11 shrink-0 items-center gap-1.5 rounded-full bg-accent px-4 text-xs font-bold text-accent-foreground shadow-sm transition active:scale-[0.98]"
          >
            <Plus className="h-3.5 w-3.5" aria-hidden />
            {promotion.type === "nxm" ? `Agregar ${promotion.buy_quantity ?? "promoción"}×${promotion.pay_quantity ?? ""}` : "Agregar paquete"}
          </button>
          ) : grouped ? null : (
            <p className="shrink-0 text-xs font-semibold text-emerald-700">Se aplica automáticamente</p>
          )}
        </div>
      </div>
    </section>
  );
}
