"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { ShoppingCart } from "lucide-react";
import { addPromotion } from "@/services/publicCartService";
import { dispatchCartUpdated } from "@/lib/cartEvents";
import { useFingerprint } from "@/hooks/useFingerprint";

interface PromotionDetailActionsProps {
  promotionId: string;
  tenantId: string;
  sitioSlug: string;
  accentColor: string;
  hasAddableProducts: boolean;
}

export default function PromotionDetailActions({
  promotionId,
  tenantId,
  sitioSlug,
  accentColor,
  hasAddableProducts,
}: PromotionDetailActionsProps) {
  const router = useRouter();
  const fingerprint = useFingerprint();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleAddToCart = async () => {
    if (!hasAddableProducts || !fingerprint) return;
    setLoading(true);
    setError(null);
    try {
      await addPromotion(tenantId, promotionId, fingerprint);
      dispatchCartUpdated();
      router.push(`/sitio/${sitioSlug}/carrito`);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Error al agregar");
    } finally {
      setLoading(false);
    }
  };

  if (!hasAddableProducts) return null;

  return (
    <div>
      <button
        type="button"
        onClick={handleAddToCart}
        disabled={loading || !fingerprint}
        className="flex w-full cursor-pointer items-center justify-center gap-2 rounded-xl px-6 py-4 text-base font-semibold text-white transition-all hover:opacity-90 hover:shadow-lg disabled:opacity-50"
        style={{ backgroundColor: accentColor }}
      >
        <ShoppingCart className="h-5 w-5" />
        {loading ? "Agregando…" : "Agregar promoción al carrito"}
      </button>
      {error && (
        <p className="mt-2 text-sm text-red-600">{error}</p>
      )}
    </div>
  );
}
