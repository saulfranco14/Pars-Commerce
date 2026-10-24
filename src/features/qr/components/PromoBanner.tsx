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
 * Full promotional card for the QR menu. It intentionally follows the public
 * storefront composition so an offer keeps its visual impact while cards are
 * browsed horizontally in the table flow.
 */
export function PromoBanner({ promotion, cartListTotal = 0, onAddPromotion, className = "" }: PromoBannerProps) {
  const label = formatPromoLabel(promotion);
  const grouped = promotion.type === "bundle_price" || promotion.type === "nxm";
  const remaining = Math.max(0, Number(promotion.min_amount ?? 0) - cartListTotal);
  const fallbackDetail = promotion.type === "nxm"
    ? `Lleva ${promotion.buy_quantity ?? ""} y paga ${promotion.pay_quantity ?? ""}`
    : grouped
      ? "Incluye los productos del paquete"
      : "Descuento disponible en este producto";
  const detail = promotion.description?.trim() || fallbackDetail;

  return (
    <section
      className={`overflow-hidden rounded-2xl border border-accent/20 bg-surface shadow-sm ${className}`}
      aria-label={`Promoción: ${label}`}
    >
      <div className="relative aspect-[16/8] overflow-hidden bg-accent">
        {promotion.image_url ? (
          <Image
            src={promotion.image_url}
            alt=""
            fill
            loading="lazy"
            sizes="(max-width: 480px) calc(100vw - 3.5rem), 420px"
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
        <p className="mt-1 line-clamp-2 min-h-10 text-sm font-bold leading-5 text-foreground">{promotion.name}</p>
        <p className="mt-1 line-clamp-1 text-xs leading-4 text-muted-foreground">{detail}</p>
        {remaining > 0 ? (
          <div className="mt-3 flex min-h-11 items-center">
            <p className="line-clamp-2 text-xs font-semibold leading-4 text-amber-800">
              Agrega ${remaining.toFixed(2)} más para activarla
            </p>
          </div>
        ) : grouped ? (
          <div className="mt-3 flex min-h-11 items-center justify-between gap-3">
            <p className="flex items-center gap-1 text-xs text-muted-foreground">
              <Clock className="h-3.5 w-3.5" aria-hidden />
              {promotion.valid_until ? "Vigente por tiempo limitado" : "Disponible ahora"}
            </p>
            <button
              type="button"
              onClick={() => onAddPromotion?.(promotion)}
              className="inline-flex min-h-11 shrink-0 items-center gap-1.5 rounded-full bg-accent px-4 text-xs font-bold text-accent-foreground shadow-sm transition active:scale-[0.98]"
            >
              <Plus className="h-3.5 w-3.5" aria-hidden />
              Agregar
            </button>
          </div>
        ) : (
          <div className="mt-3 flex min-h-11 items-center">
            <p className="text-xs font-semibold leading-4 text-accent">
              Se descuenta automáticamente al agregar productos
            </p>
          </div>
        )}
      </div>
    </section>
  );
}
