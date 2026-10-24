"use client";

import Image from "next/image";
import { Tag } from "lucide-react";

import { formatPromoLabel } from "@/features/qr/helpers/formatPromoLabel";

import type { QrPromotion } from "@/features/qr/interfaces/promotion";

interface PromoBannerProps {
  promotion: QrPromotion;
  cartListTotal?: number;
  onAddPromotion?: (promotion: QrPromotion) => void;
}

/**
 * Rappi-style promo banner shown inside the QR menu: a small image (or a Tag
 * icon fallback) on the left, a short value label + name on the right. Purely
 * informational — it never navigates the customer OUT of the ordering flow.
 *
 * Uses the QR design tokens (accent-tinted surface, rounded-2xl) so it sits
 * naturally among the product cards. Neutral/multi-business.
 */
export function PromoBanner({ promotion, cartListTotal = 0, onAddPromotion }: PromoBannerProps) {
  const label = formatPromoLabel(promotion);
  const grouped = promotion.type === "bundle_price" || promotion.type === "nxm";
  const remaining = Math.max(0, Number(promotion.min_amount ?? 0) - cartListTotal);

  return (
    <section
      className="flex items-center gap-3 rounded-2xl border border-accent/30 bg-accent/5 p-3"
      aria-label={`Promoción: ${label}`}
    >
      <span className="relative flex h-14 w-14 shrink-0 items-center justify-center overflow-hidden rounded-xl bg-accent/10 text-accent">
        {promotion.image_url ? (
          <Image
            src={promotion.image_url}
            alt={promotion.name}
            fill
            loading="lazy"
            sizes="56px"
            className="rounded-xl object-cover"
          />
        ) : (
          <Tag className="h-6 w-6" strokeWidth={2.25} />
        )}
      </span>

      <div className="min-w-0 flex-1">
        <p className="text-sm font-bold leading-snug text-accent">{label}</p>
        <p className="truncate text-xs font-medium text-foreground">
          {promotion.name}
        </p>
        {promotion.description && (
          <p className="truncate text-xs text-muted-foreground">
            {promotion.description}
          </p>
        )}
        {remaining > 0 ? (
          <p className="mt-1 text-xs font-semibold text-amber-700">
            Agrega ${remaining.toFixed(2)} para activarla
          </p>
        ) : grouped ? (
          <button
            type="button"
            onClick={() => onAddPromotion?.(promotion)}
            className="mt-2 min-h-11 rounded-xl bg-accent px-4 text-xs font-bold text-accent-foreground shadow-sm transition active:scale-[0.98]"
          >
            {promotion.type === "nxm" ? `Agregar ${promotion.buy_quantity ?? "promoción"}×${promotion.pay_quantity ?? ""}` : "Agregar paquete"}
          </button>
        ) : (
          <p className="mt-1 text-xs font-semibold text-amber-700">Se aplica automáticamente</p>
        )}
      </div>
    </section>
  );
}
