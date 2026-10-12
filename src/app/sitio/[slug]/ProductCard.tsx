"use client";

import { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { MessageCircle, Package, ShoppingCart, Eye, Check, SlidersHorizontal } from "lucide-react";
import { addItem } from "@/services/publicCartService";
import { dispatchCartUpdated } from "@/lib/cartEvents";
import { useFingerprint } from "@/hooks/useFingerprint";
import type { ProductPromotionResult } from "@/lib/promotionPrice";

interface ProductCardProps {
  product: {
    id: string;
    name: string;
    slug: string | null;
    description?: string | null;
    price: number;
    image_url: string | null;
    image_urls?: string[];
    type?: string;
    has_variants?: boolean;
  };
  promotion?: ProductPromotionResult | null;
  tenantId: string;
  sitioSlug: string;
  accentColor: string;
  whatsappPhone: string | null;
  baseUrl?: string;
  /** true para la primera tarjeta del grid (LCP) */
  priority?: boolean;
  compact?: boolean;
}

function buildWhatsAppUrl(
  phone: string,
  productName: string,
  productUrl: string,
): string {
  const text = encodeURIComponent(
    `Hola, me interesa: ${productName}\n${productUrl}`,
  );
  const cleanPhone = phone.replace(/\D/g, "");
  return `https://wa.me/${cleanPhone}?text=${text}`;
}

export default function ProductCard({
  product,
  promotion,
  tenantId,
  sitioSlug,
  accentColor,
  whatsappPhone,
  baseUrl = "",
  priority = false,
  compact = false,
}: ProductCardProps) {
  const fingerprint = useFingerprint();
  const [loading, setLoading] = useState(false);
  const [added, setAdded] = useState(false);
  const productPath = `/sitio/${sitioSlug}/productos/${product.slug || product.id}`;
  const productUrl = baseUrl ? `${baseUrl}${productPath}` : productPath;

  const imageUrls = product.image_urls?.length
    ? product.image_urls
    : product.image_url
      ? [product.image_url]
      : [];
  const mainImage = imageUrls[0] ?? null;
  const displayPrice = promotion ? promotion.finalPrice : Number(product.price);
  const showOriginalPrice =
    promotion && promotion.finalPrice < Number(product.price);
  const badgeText = promotion?.discountPercent
    ? `-${promotion.discountPercent}%`
    : (promotion?.badgeLabel ?? null);

  const waHref = whatsappPhone
    ? buildWhatsAppUrl(whatsappPhone, product.name, productUrl)
    : null;

  const handleAddToCart = async () => {
    if (!fingerprint) return;
    setLoading(true);
    try {
      await addItem(tenantId, product.id, 1, fingerprint);
      dispatchCartUpdated({ label: `${product.name} se agregó al carrito` });
      setAdded(true);
      window.setTimeout(() => setAdded(false), 1800);
    } finally {
      setLoading(false);
    }
  };

  return (
    <article className="group flex h-full flex-col overflow-hidden rounded-[20px] border border-gray-200 bg-white shadow-[0_12px_32px_-26px_rgba(15,23,42,0.55)] transition-[box-shadow,border-color] duration-300 hover:border-gray-300 hover:shadow-[0_18px_38px_-24px_rgba(15,23,42,0.3)]">
      {/* Image area */}
      <Link href={productPath} className={`relative block overflow-hidden bg-gray-100 ${compact ? "aspect-square sm:aspect-[5/4]" : "aspect-4/3"}`}>
        {mainImage ? (
          <>
            <Image
              src={mainImage}
              alt={product.name}
              fill
              sizes="(max-width: 640px) 78vw, (max-width: 1024px) 50vw, 33vw"
              className="object-cover transition-transform duration-500 group-hover:scale-[1.025]"
              priority={priority}
              quality={75}
            />
            <div className="absolute inset-0 hidden items-center justify-center bg-black/20 opacity-0 transition-opacity duration-300 group-hover:opacity-100 sm:flex">
              <span className="flex translate-y-2 items-center gap-1.5 rounded-full bg-white px-4 py-2 text-xs font-semibold text-gray-900 shadow-lg transition-transform duration-300 group-hover:translate-y-0">
                <Eye className="h-3.5 w-3.5" />
                Ver detalle
              </span>
            </div>
          </>
        ) : (
          <div className="flex h-full items-center justify-center">
            <Package className="h-16 w-16 text-gray-200" />
          </div>
        )}

        {/* Discount badge */}
        {badgeText && (
          <div className="absolute left-3 top-3 rounded-full bg-red-600 px-2.5 py-1 text-xs font-bold text-white shadow-md">
            {badgeText}
          </div>
        )}

        {/* Multiple images indicator */}
        {imageUrls.length > 1 && (
          <div className="absolute bottom-3 left-1/2 flex -translate-x-1/2 gap-1">
            {imageUrls.slice(0, 4).map((_, i) => (
              <div
                key={i}
                className={`h-1.5 w-1.5 rounded-full transition-all ${i === 0 ? "w-3 bg-white" : "bg-white/60"}`}
              />
            ))}
          </div>
        )}
      </Link>

      {/* Card content */}
      <div className={`flex flex-1 flex-col ${compact ? "min-h-[118px] p-3.5" : "min-h-36 p-4"}`}>
        <p className="mb-1 text-[10px] font-bold uppercase tracking-[0.12em] text-gray-400">
          {product.type === "service" ? "Servicio" : "Producto"}
        </p>
        <Link href={productPath}>
          <h3 className="line-clamp-2 text-[15px] font-bold leading-snug text-gray-950 transition-opacity hover:opacity-70 sm:text-base">
            {product.name}
          </h3>
        </Link>
        <p className={`${compact ? "mt-1 line-clamp-1" : "mt-1 min-h-9 line-clamp-2"} text-xs leading-relaxed text-gray-500`}>
          {product.description || " "}
        </p>
        <div className="mt-auto flex items-baseline gap-2 pt-3">
          <span className={`${compact ? "text-lg" : "text-xl"} font-bold tracking-tight`} style={{ color: accentColor }}>
            ${displayPrice.toFixed(2)}
          </span>
          {showOriginalPrice && (
            <span className="text-sm text-gray-400 line-through">
              ${Number(product.price).toFixed(2)}
            </span>
          )}
        </div>
      </div>

      {/* Action buttons */}
      <div className={`flex flex-col gap-2 ${compact ? "px-3.5 pb-3.5" : "px-4 pb-4"}`}>
        {product.has_variants ? (
          <Link
            href={productPath}
            className="flex min-h-12 w-full items-center justify-center gap-2 rounded-xl px-4 py-3 text-sm font-bold text-white transition-all active:scale-[0.98]"
            style={{ backgroundColor: accentColor }}
          >
            <SlidersHorizontal className="h-4 w-4" />
            Elegir talla o color
          </Link>
        ) : (
          <button
            type="button"
            onClick={handleAddToCart}
            disabled={loading || !fingerprint}
            aria-busy={loading}
            className="flex min-h-12 w-full cursor-pointer items-center justify-center gap-2 rounded-xl px-4 py-3 text-sm font-bold text-white transition-all active:scale-[0.98] disabled:cursor-wait disabled:opacity-50"
            style={{ backgroundColor: accentColor }}
          >
            <ShoppingCart className="h-4 w-4" />
            {loading ? "Agregando…" : added ? <><Check className="h-4 w-4" />Agregado</> : product.type === "service" ? (compact ? "Elegir" : "Elegir servicio") : (compact ? "Agregar" : "Agregar al carrito")}
          </button>
        )}
        {waHref && !compact && (
          <a
            href={waHref}
            target="_blank"
            rel="noopener noreferrer"
            className="flex cursor-pointer items-center justify-center gap-2 rounded-xl border px-4 py-2.5 text-sm font-medium transition-all hover:bg-gray-50 active:scale-95"
            style={{ borderColor: `${accentColor}55`, color: accentColor }}
          >
            <MessageCircle className="h-4 w-4" />
            Consultar por WhatsApp
          </a>
        )}
      </div>
    </article>
  );
}
