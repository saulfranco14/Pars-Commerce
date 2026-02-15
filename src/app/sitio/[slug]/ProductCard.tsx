"use client";

import { useState } from "react";
import { ShoppingCart, Check } from "lucide-react";
import { addItem } from "@/services/publicCartService";

function getFingerprint(): string {
  if (typeof window === "undefined") return "server";
  let fp = localStorage.getItem("pars_fingerprint");
  if (!fp) {
    fp = `fp_${Date.now()}_${Math.random().toString(36).slice(2, 11)}`;
    localStorage.setItem("pars_fingerprint", fp);
  }
  return fp;
}

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
  accentColor: string;
}

export default function ProductCard({
  product,
  tenantId,
  accentColor,
}: ProductCardProps) {
  const [loading, setLoading] = useState(false);
  const [added, setAdded] = useState(false);

  async function handleAddToCart() {
    setLoading(true);
    setAdded(false);
    try {
      await addItem(tenantId, product.id, 1, getFingerprint());
      setAdded(true);
      setTimeout(() => setAdded(false), 2000);
    } catch {
      setAdded(false);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="group flex flex-col overflow-hidden rounded-xl bg-white shadow-sm transition-all hover:shadow-lg hover:-translate-y-1">
      {/* Image */}
      <div className="relative h-48 w-full overflow-hidden bg-gray-100">
        {product.image_url ? (
          <img
            src={product.image_url}
            alt={product.name}
            className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-110"
          />
        ) : (
          <div className="flex h-full items-center justify-center">
            <ShoppingCart className="h-12 w-12 text-gray-300" />
          </div>
        )}
        {/* Price badge */}
        <div
          className="absolute right-3 top-3 rounded-lg px-3 py-1 text-sm font-bold text-white shadow-md"
          style={{ backgroundColor: accentColor }}
        >
          ${Number(product.price).toFixed(2)}
        </div>
      </div>

      {/* Content */}
      <div className="flex flex-1 flex-col p-4">
        <h3 className="font-semibold text-gray-900">{product.name}</h3>
        {product.description && (
          <p className="mt-1 line-clamp-2 text-sm text-gray-500">
            {product.description}
          </p>
        )}

        <button
          type="button"
          onClick={handleAddToCart}
          disabled={loading}
          className="mt-4 flex w-full items-center justify-center gap-2 rounded-lg px-4 py-2.5 text-sm font-semibold text-white transition-all hover:opacity-90 hover:shadow-md disabled:opacity-50"
          style={{ backgroundColor: added ? "#16a34a" : accentColor }}
        >
          {loading ? (
            <span className="inline-block h-4 w-4 animate-spin rounded-full border-2 border-white/30 border-t-white" />
          ) : added ? (
            <Check className="h-4 w-4" />
          ) : (
            <ShoppingCart className="h-4 w-4" />
          )}
          {loading ? "Añadiendo..." : added ? "Añadido" : "Añadir al carrito"}
        </button>
      </div>
    </div>
  );
}
