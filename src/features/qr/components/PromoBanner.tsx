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
 * A QR-only horizontal promotion card. The promotional artwork and the order
 * decision stay together without turning the table menu into the storefront.
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
      className={`flex min-h-40 overflow-hidden rounded-2xl border border-accent/20 bg-surface shadow-sm ${className}`}
      aria-label={`Promoción: ${label}`}
    >
      <div className="relative flex w-32 shrink-0 overflow-hidden bg-accent">
        {promotion.image_url ? (
          <Image
            src={promotion.image_url}
            alt=""
            fill
            loading="lazy"
            sizes="128px"
            className="object-cover"
          />
        ) : (
          <div className="absolute inset-0">
            <PromotionCollage
              {...promotionCollageLabel(promotion)}
              images={promotion.preview_images}
              showLabel={false}
            />
          </div>
        )}
        <span aria-hidden className="absolute inset-0 bg-gradient-to-t from-black/45 via-transparent to-transparent" />
        <div className="absolute inset-x-3 bottom-3 z-10">
          <p className="text-[9px] font-bold uppercase tracking-[0.14em] text-white/80">Oferta</p>
          <p className="line-clamp-2 text-xl font-extrabold leading-5 tracking-tight text-white">{label}</p>
        </div>
      </div>

      <div className="flex min-w-0 flex-1 flex-col p-3">
        <p className="flex items-center gap-1 text-[10px] font-bold text-accent">
          <Clock className="h-3.5 w-3.5" aria-hidden />
          {promotion.valid_until ? "Vigente por tiempo limitado" : "Disponible ahora"}
        </p>
        <p className="mt-1 line-clamp-2 min-h-10 text-sm font-bold leading-5 text-foreground">{promotion.name}</p>
        <p className="mt-1 line-clamp-2 text-[10px] leading-3.5 text-muted-foreground">{detail}</p>
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
              aria-label="Agregar promoción"
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
