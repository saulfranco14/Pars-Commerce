"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { MessageCircle, Package, ShoppingCart } from "lucide-react";
import { addItem } from "@/services/publicCartService";
import { useFingerprint } from "@/hooks/useFingerprint";

interface ProductCardProps {
  product: {
    id: string;
    name: string;
    slug: string | null;
    description: string | null;
    price: number;
    image_url: string | null;
  };
  tenantId: string;
  sitioSlug: string;
  accentColor: string;
  whatsappPhone: string | null;
  baseUrl?: string;
}

function buildWhatsAppUrl(phone: string, productName: string, productUrl: string): string {
  const text = encodeURIComponent(`Hola, me interesa: ${productName}\n${productUrl}`);
  const cleanPhone = phone.replace(/\D/g, "");
  return `https://wa.me/${cleanPhone}?text=${text}`;
}

export default function ProductCard({
  product,
  tenantId,
  sitioSlug,
  accentColor,
  whatsappPhone,
  baseUrl = "",
}: ProductCardProps) {
  const router = useRouter();
  const fingerprint = useFingerprint();
  const [loading, setLoading] = useState(false);
  const productPath = `/sitio/${sitioSlug}/productos/${product.slug || product.id}`;
  const productUrl = baseUrl ? `${baseUrl}${productPath}` : productPath;

  const waHref = whatsappPhone
    ? buildWhatsAppUrl(whatsappPhone, product.name, productUrl)
    : null;

  const handleAddToCart = async () => {
    if (!fingerprint) return;
    setLoading(true);
    try {
      await addItem(tenantId, product.id, 1, fingerprint);
      router.push(`/sitio/${sitioSlug}/carrito`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="group flex flex-col overflow-hidden rounded-xl bg-white shadow-sm transition-all hover:shadow-lg hover:-translate-y-1">
      <Link href={`/sitio/${sitioSlug}/productos/${product.slug || product.id}`}>
        <div className="relative h-48 w-full overflow-hidden bg-gray-100">
          {product.image_url ? (
            <img
              src={product.image_url}
              alt={product.name}
              className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-110"
            />
          ) : (
            <div className="flex h-full items-center justify-center">
              <Package className="h-12 w-12 text-gray-300" />
            </div>
          )}
          <div
            className="absolute right-3 top-3 rounded-lg px-3 py-1 text-sm font-bold text-white shadow-md"
            style={{ backgroundColor: accentColor }}
          >
            ${Number(product.price).toFixed(2)}
          </div>
        </div>
        <div className="flex flex-1 flex-col p-4">
          <h3 className="font-semibold text-gray-900">{product.name}</h3>
          {product.description && (
            <p className="mt-1 line-clamp-2 text-sm text-gray-500">
              {product.description}
            </p>
          )}
        </div>
      </Link>
      <div className="mx-4 mb-4 flex flex-col gap-2">
        <button
          type="button"
          onClick={handleAddToCart}
          disabled={loading || !fingerprint}
          className="flex w-full cursor-pointer items-center justify-center gap-2 rounded-lg px-4 py-2.5 text-sm font-semibold text-white transition-all hover:opacity-90 hover:shadow-md disabled:opacity-50"
          style={{ backgroundColor: accentColor }}
        >
          <ShoppingCart className="h-4 w-4" />
          {loading ? "Agregando…" : "Agregar al carrito"}
        </button>
        {waHref ? (
          <a
            href={waHref}
            target="_blank"
            rel="noopener noreferrer"
            className="flex cursor-pointer items-center justify-center gap-2 rounded-lg border-2 px-4 py-2.5 text-sm font-semibold transition-all hover:opacity-90"
            style={{ borderColor: accentColor, color: accentColor }}
          >
            <MessageCircle className="h-4 w-4" />
            Consultar por WhatsApp
          </a>
        ) : (
          <p className="text-center text-xs text-gray-500">
            Configura WhatsApp en tu dashboard
          </p>
        )}
      </div>
    </div>
  );
}
