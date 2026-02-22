"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Tag, ShoppingCart, Clock } from "lucide-react";
import { addPromotion } from "@/services/publicCartService";
import { dispatchCartUpdated } from "@/lib/cartEvents";
import { useFingerprint } from "@/hooks/useFingerprint";

interface PromotionCardProps {
  promotion: {
    id: string;
    name: string;
    slug: string | null;
    type: string;
    value: number;
    quantity?: number | null;
    min_amount?: number | null;
    valid_until?: string | null;
    image_url?: string | null;
    badge_label?: string | null;
  };
  tenantId: string;
  sitioSlug: string;
  accentColor: string;
  hasAddableProducts: boolean;
}

function formatPromoValue(p: PromotionCardProps["promotion"]): string {
  const val = Number(p.value);
  if (p.type === "percentage") return `${val}% de descuento`;
  if (p.type === "fixed_amount") return `$${val.toFixed(2)} de descuento`;
  if (p.type === "bundle_price") return p.quantity ? `${p.quantity} por $${val.toFixed(2)}` : `$${val.toFixed(2)}`;
  if (p.type === "fixed_price") return `Precio especial $${val.toFixed(2)}`;
  if (p.type === "event_badge") return p.badge_label || "Promoción";
  return `$${val.toFixed(2)}`;
}

export default function PromotionCard({
  promotion,
  tenantId,
  sitioSlug,
  accentColor,
  hasAddableProducts,
}: PromotionCardProps) {
  const router = useRouter();
  const fingerprint = useFingerprint();
  const [loading, setLoading] = useState(false);
  const promoSlug = promotion.slug || promotion.id;
  const linkPath = `/sitio/${sitioSlug}/promociones/${promoSlug}`;

  const handleAddToCart = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (!hasAddableProducts || !fingerprint) return;
    setLoading(true);
    try {
      await addPromotion(tenantId, promotion.id, fingerprint);
      dispatchCartUpdated();
      router.push(`/sitio/${sitioSlug}/carrito`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Link href={linkPath} className="block">
      <div className="group flex flex-col overflow-hidden rounded-2xl bg-white shadow-sm border border-gray-100 transition-all duration-300 hover:shadow-xl hover:-translate-y-1">
        {/* Image */}
        <div className="relative aspect-video w-full overflow-hidden bg-gray-100">
          {promotion.image_url ? (
            <img
              src={promotion.image_url}
              alt={promotion.name}
              className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
            />
          ) : (
            <div
              className="flex h-full w-full items-center justify-center"
              style={{ backgroundColor: `${accentColor}15` }}
            >
              <Tag className="h-10 w-10" style={{ color: accentColor }} />
            </div>
          )}
          {/* Promo value badge */}
          <div
            className="absolute left-3 top-3 rounded-full px-3 py-1.5 text-xs font-bold text-white shadow-md"
            style={{ backgroundColor: accentColor }}
          >
            {formatPromoValue(promotion)}
          </div>
        </div>

        {/* Content */}
        <div className="flex flex-1 flex-col p-4">
          <h3 className="font-bold text-gray-900 leading-snug">{promotion.name}</h3>
          {promotion.valid_until && (
            <p className="mt-1.5 flex items-center gap-1 text-xs text-gray-400">
              <Clock className="h-3.5 w-3.5" />
              Válida hasta{" "}
              {new Date(promotion.valid_until).toLocaleDateString("es-MX", {
                day: "numeric",
                month: "short",
                year: "numeric",
              })}
            </p>
          )}
          {hasAddableProducts && (
            <button
              type="button"
              onClick={handleAddToCart}
              disabled={loading || !fingerprint}
              className="mt-4 flex w-full items-center justify-center gap-2 rounded-xl px-4 py-2.5 text-sm font-semibold text-white transition-all active:scale-95 disabled:opacity-50"
              style={{ backgroundColor: accentColor }}
            >
              <ShoppingCart className="h-4 w-4" />
              {loading ? "Agregando…" : "Agregar al carrito"}
            </button>
          )}
        </div>
      </div>
    </Link>
  );
}
