import { notFound } from "next/navigation";
import { Tag } from "lucide-react";

import { ProductGrid } from "@/features/sitio/components/catalog/ProductGrid";
import { PromotionCard } from "@/features/sitio/components/promotions/PromotionCard";
import { StoreEmptyState } from "@/features/sitio/components/StoreEmptyState";
import { StorePageHeader } from "@/features/sitio/components/StorePageHeader";
import { StoreSectionHeader } from "@/features/sitio/components/StoreSectionHeader";

import { promotionProductIds } from "@/features/sitio/helpers/promotions";
import { catalogHref } from "@/features/sitio/helpers/storeLinks";
import {
  getActivePromotions,
  getStoreTenant,
  listCatalogItemsByIds,
} from "@/features/sitio/services/storefrontService";

import type { Metadata } from "next";

export const dynamic = "force-dynamic";

export const metadata: Metadata = { title: "Promociones" };

interface PageProps {
  params: Promise<{ slug: string }>;
}

export default async function PromocionesPage({ params }: PageProps) {
  const { slug } = await params;
  const tenant = await getStoreTenant(slug);
  if (!tenant) notFound();

  const promotions = await getActivePromotions(tenant.id);
  const productIds = [...new Set(promotions.flatMap(promotionProductIds))];
  const promoItems = await listCatalogItemsByIds(tenant.id, productIds);

  return (
    <div className="space-y-10 sm:space-y-14">
      <StorePageHeader
        title="Promociones"
        description={
          promotions.length > 0
            ? `${promotions.length} ${promotions.length === 1 ? "oferta vigente" : "ofertas vigentes"}`
            : undefined
        }
      />

      {promotions.length === 0 ? (
        <StoreEmptyState
          icon={Tag}
          title="No hay promociones vigentes"
          description="Vuelve pronto o explora el catálogo completo."
          action={{ href: catalogHref(slug), label: "Ver catálogo" }}
        />
      ) : (
        <>
          <ul className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {promotions.map((promotion) => (
              <li key={promotion.id}>
                <PromotionCard promotion={promotion} tenantId={tenant.id} slug={slug} />
              </li>
            ))}
          </ul>

          {promoItems.length > 0 ? (
            <section aria-labelledby="promo-items-title">
              <StoreSectionHeader id="promo-items-title" title="En promoción" subtitle="El precio ya incluye el descuento." />
              <ProductGrid items={promoItems} tenantId={tenant.id} slug={slug} />
            </section>
          ) : null}
        </>
      )}
    </div>
  );
}
