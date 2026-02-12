"use client";

import { useState } from "react";
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
    <div className="flex flex-col rounded-lg border border-border bg-surface-raised overflow-hidden">
      {product.image_url && (
        <img
          src={product.image_url}
          alt=""
          className="h-40 w-full object-cover"
        />
      )}
      <div className="flex flex-1 flex-col p-3">
        <p className="font-medium text-foreground">{product.name}</p>
        {product.description && (
          <p className="mt-1 line-clamp-2 text-sm text-muted-foreground">
            {product.description}
          </p>
        )}
        <p
          className="mt-2 text-sm font-semibold"
          style={{ color: accentColor }}
        >
          ${Number(product.price).toFixed(2)}
        </p>
        <button
          type="button"
          onClick={handleAddToCart}
          disabled={loading}
          className="mt-3 w-full rounded-md px-3 py-2 text-sm font-medium text-accent-foreground hover:opacity-90 disabled:opacity-50"
          style={{ backgroundColor: accentColor }}
        >
          {loading ? "Añadiendo..." : added ? "Añadido" : "Añadir al carrito"}
        </button>
      </div>
    </div>
  );
}
