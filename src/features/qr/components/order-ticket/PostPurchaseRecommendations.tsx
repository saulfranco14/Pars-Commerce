"use client";

import { useState } from "react";
import useSWR from "swr";
import { Plus } from "lucide-react";

import { Toast } from "@/components/ui/Toast";
import { ProductDetailSheet } from "@/features/qr/components/menu-product/ProductDetailSheet";
import { ProductTile } from "@/features/qr/components/menu-product/ProductTile";
import { useFingerprint } from "@/hooks/useFingerprint";
import { dispatchCartUpdated } from "@/lib/cartEvents";
import { addItem } from "@/services/publicCartService";

import type { MenuItem } from "@/features/qr/interfaces/tableCart";

interface PostPurchaseRecommendationsProps {
  tenantId: string;
  tenantName: string;
  tenantLogoUrl?: string | null;
  purchasedProductIds: string[];
}

async function fetchRecommendations(url: string): Promise<MenuItem[]> {
  const response = await fetch(url);
  if (!response.ok) throw new Error("No se pudieron cargar las sugerencias");
  return response.json();
}

/**
 * Reuses the compact product rail from the QR menu. The catalog itself defines
 * the content, so the component works for every business vertical.
 */
export function PostPurchaseRecommendations({
  tenantId,
  tenantName,
  tenantLogoUrl,
  purchasedProductIds,
}: PostPurchaseRecommendationsProps) {
  const fingerprint = useFingerprint();
  const { data, isLoading } = useSWR<MenuItem[]>(
    `/api/public/products?tenant_id=${encodeURIComponent(tenantId)}`,
    fetchRecommendations,
    { revalidateOnFocus: false, dedupingInterval: 60_000 },
  );
  const [detail, setDetail] = useState<MenuItem | null>(null);
  const [addedProduct, setAddedProduct] = useState<string | null>(null);
  const [addError, setAddError] = useState<string | null>(null);

  const purchased = new Set(purchasedProductIds);
  const products = (data ?? [])
    .filter((product) => !purchased.has(product.id))
    .slice(0, 8);

  async function addMany(productId: string, quantity: number) {
    if (!fingerprint || quantity < 1) return;
    setAddError(null);
    const product = products.find((candidate) => candidate.id === productId);
    try {
      await addItem(tenantId, productId, quantity, fingerprint);
      dispatchCartUpdated();
      setAddedProduct(product?.name ?? "Producto");
    } catch {
      setAddError("No pudimos guardarlo para tu nueva compra.");
    }
  }

  if (!isLoading && products.length === 0) return null;

  return (
    <section className="rounded-2xl border border-border bg-surface p-3 shadow-sm" aria-labelledby="more-title">
      {addedProduct && (
        <Toast
          tone="success"
          message={`${addedProduct} se guardó para tu nueva compra.`}
          onDone={() => setAddedProduct(null)}
        />
      )}
      <div className="flex items-center gap-2.5">
        <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-accent text-accent-foreground">
          <Plus className="h-4 w-4" strokeWidth={2.75} aria-hidden />
        </span>
        <div>
          <h2 id="more-title" className="text-sm font-bold text-foreground">
            ¿Te faltó algo?
          </h2>
          <p className="text-xs text-muted-foreground">
            Agrega productos a una nueva compra sin salir de aquí.
          </p>
        </div>
      </div>

      {isLoading ? (
        <div className="mt-3 flex gap-2.5 overflow-hidden" aria-label="Cargando productos">
          {[0, 1, 2].map((item) => (
            <div key={item} className="h-40 w-28 shrink-0 animate-pulse rounded-xl bg-border-soft/60" />
          ))}
        </div>
      ) : (
        <div className="mt-3 flex gap-2.5 overflow-x-auto pb-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
          {products.map((product) => (
            <ProductTile
              key={product.id}
              product={product}
              onAdd={(id) => void addMany(id, 1)}
              onOpenDetail={setDetail}
              tenantLogoUrl={tenantLogoUrl}
              tenantName={tenantName}
            />
          ))}
        </div>
      )}

      {addError && (
        <p className="mt-2 text-xs font-semibold text-red-700" role="alert">
          {addError}
        </p>
      )}

      <ProductDetailSheet
        product={detail}
        isOpen={detail !== null}
        onClose={() => setDetail(null)}
        inCartQuantity={0}
        onAdd={(id, quantity) => void addMany(id, quantity)}
        tenantLogoUrl={tenantLogoUrl}
        tenantName={tenantName}
      />
    </section>
  );
}
