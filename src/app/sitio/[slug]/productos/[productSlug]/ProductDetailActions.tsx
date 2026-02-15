"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { MessageCircle, ShoppingCart } from "lucide-react";
import { addItem } from "@/services/publicCartService";
import { useFingerprint } from "@/hooks/useFingerprint";

interface ProductDetailActionsProps {
  productId: string;
  tenantId: string;
  sitioSlug: string;
  accentColor: string;
  waHref: string | null;
}

export default function ProductDetailActions({
  productId,
  tenantId,
  sitioSlug,
  accentColor,
  waHref,
}: ProductDetailActionsProps) {
  const router = useRouter();
  const fingerprint = useFingerprint();
  const [loading, setLoading] = useState(false);

  const handleAddToCart = async () => {
    if (!fingerprint) return;
    setLoading(true);
    try {
      await addItem(tenantId, productId, 1, fingerprint);
      router.push(`/sitio/${sitioSlug}/carrito`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="mt-6 flex flex-col gap-3">
      <button
        type="button"
        onClick={handleAddToCart}
        disabled={loading || !fingerprint}
        className="flex w-full cursor-pointer items-center justify-center gap-2 rounded-xl px-6 py-4 text-base font-semibold text-white transition-all hover:opacity-90 hover:shadow-lg disabled:opacity-50"
        style={{ backgroundColor: accentColor }}
      >
        <ShoppingCart className="h-5 w-5" />
        {loading ? "Agregando…" : "Agregar al carrito"}
      </button>
      {waHref ? (
        <a
          href={waHref}
          target="_blank"
          rel="noopener noreferrer"
          className="flex cursor-pointer items-center justify-center gap-2 rounded-xl border-2 px-6 py-4 text-base font-semibold transition-all hover:opacity-90"
          style={{ borderColor: accentColor, color: accentColor }}
        >
          <MessageCircle className="h-5 w-5" />
          Consultar por WhatsApp
        </a>
      ) : (
        <p className="text-center text-sm text-gray-500">
          Configura WhatsApp en el dashboard para habilitar consultas.
        </p>
      )}
    </div>
  );
}
