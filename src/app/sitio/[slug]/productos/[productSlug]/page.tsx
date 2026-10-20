/* eslint-disable @typescript-eslint/no-explicit-any -- Commerce schema types are regenerated after the migration rollout. */
import { cache } from "react";
import { createAdminClient } from "@/lib/supabase/admin";
import { notFound } from "next/navigation";
import Link from "next/link";
import { ChevronLeft, Ruler, Shirt, Sparkles, Star, Tag } from "lucide-react";

import { ProductGrid } from "@/features/sitio/components/catalog/ProductGrid";
import { ServiceList } from "@/features/sitio/components/catalog/ServiceList";
import { StoreSectionHeader } from "@/features/sitio/components/StoreSectionHeader";
import ProductImageGallery from "../ProductImageGallery";
import ProductDetailActions from "./ProductDetailActions";
import ProductReviewsList, {
  type PublicProductReview,
} from "./ProductReviewsList";

import { buildProductPromoMap } from "@/lib/promotionPrice";
import { formatCurrency } from "@/features/qr/helpers/format";
import { DEFAULT_TENANT_ACCENT } from "@/features/sitio-web/constants/templateStyles";
import { storeDisplayFont, storeFocusRing } from "@/features/sitio/constants/storeClasses";
import { collectionLayout } from "@/features/sitio/helpers/catalogMedia";
import { toPromotionsForPrice } from "@/features/sitio/helpers/promotions";
import { catalogHref, productInquiryHref } from "@/features/sitio/helpers/storeLinks";
import {
  getActivePromotions,
  getRequestBaseUrl,
  getStoreTenant,
  listCatalogItems,
} from "@/features/sitio/services/storefrontService";

import type { ProductBase } from "@/lib/enrichProducts";
import type { CatalogItem } from "@/features/sitio/interfaces/storefront";
import type { Metadata } from "next";

interface PageProps {
  params: Promise<{ slug: string; productSlug: string }>;
}

type ProductRow = ProductBase & {
  type?: string;
  has_variants?: boolean;
  material_info?: string | null;
  care_instructions?: string | null;
  size_guide?: string | null;
};

const RELATED_LIMIT = 4;

const getProduct = cache(async (tenantId: string, productSlug: string): Promise<ProductRow | null> => {
  const db = createAdminClient() as unknown as { from: (table: string) => any };
  const { data } = await db
    .from("products")
    .select(
      "id, name, slug, description, price, image_url, subcatalog_id, type, has_variants, material_info, care_instructions, size_guide",
    )
    .eq("tenant_id", tenantId)
    .eq("slug", productSlug)
    .eq("is_public", true)
    .is("deleted_at", null)
    .maybeSingle();
  return (data as ProductRow | null) ?? null;
});

function RelatedSection({
  id,
  title,
  subtitle,
  products,
  tenantId,
  slug,
}: {
  id: string;
  title: string;
  subtitle: string;
  products: CatalogItem[];
  tenantId: string;
  slug: string;
}) {
  if (products.length === 0) return null;
  return (
    <section aria-labelledby={id}>
      <StoreSectionHeader id={id} title={title} subtitle={subtitle} />
      {collectionLayout(products) === "text" ? (
        <div className="rounded-3xl bg-(--store-surface) px-4 shadow-sm ring-1 ring-(--store-hairline) sm:px-6">
          <ServiceList items={products} tenantId={tenantId} slug={slug} />
        </div>
      ) : (
        <ProductGrid items={products} tenantId={tenantId} slug={slug} />
      )}
    </section>
  );
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { slug, productSlug } = await params;
  const tenant = await getStoreTenant(slug);
  const product = tenant ? await getProduct(tenant.id, productSlug) : null;
  if (!product) return {};
  return {
    title: product.name,
    description: product.description?.slice(0, 160) ?? undefined,
    openGraph: product.image_url ? { images: [product.image_url] } : undefined,
  };
}

export default async function ProductoDetallePage({ params }: PageProps) {
  const { slug, productSlug } = await params;
  const tenant = await getStoreTenant(slug);
  if (!tenant) notFound();

  const product = await getProduct(tenant.id, productSlug);
  if (!product) notFound();

  const supabase = createAdminClient();
  const db = supabase as unknown as { from: (table: string) => any };
  const [imagesRes, promotions, ratingRowsRes, initialReviewsRes, catalog, baseUrl] =
    await Promise.all([
      supabase
        .from("product_images")
        .select("url, position")
        .eq("product_id", product.id)
        .order("position", { ascending: true }),
      getActivePromotions(tenant.id),
      db
        .from("product_reviews")
        .select("rating", { count: "exact" })
        .eq("product_id", product.id)
        .eq("status", "published"),
      db
        .from("product_reviews")
        .select("id, rating, comment, published_at")
        .eq("product_id", product.id)
        .eq("status", "published")
        .order("published_at", { ascending: false })
        .limit(4),
      listCatalogItems({ tenantId: tenant.id, limit: RELATED_LIMIT * 2 + 1 }),
      getRequestBaseUrl(),
    ]);

  const images = imagesRes.data ?? [];
  const imageUrls = images.length
    ? images.map((image) => image.url)
    : product.image_url
      ? [product.image_url]
      : [];

  const basePrice = Number(product.price);
  const promotion = buildProductPromoMap(
    toPromotionsForPrice(promotions),
    [product.id],
    new Map([[product.id, basePrice]]),
  ).get(product.id);
  const displayPrice = promotion?.finalPrice ?? basePrice;
  const showOriginalPrice = displayPrice < basePrice;
  const badgeText = promotion?.discountPercent
    ? `-${promotion.discountPercent}%`
    : (promotion?.badgeLabel ?? null);

  const related = catalog
    .filter((item) => item.id !== product.id)
    .sort((left, right) => {
      const leftSame = left.subcatalog_id === product.subcatalog_id ? 0 : 1;
      const rightSame = right.subcatalog_id === product.subcatalog_id ? 0 : 1;
      return leftSame - rightSame;
    });
  const similarProducts = related.filter((item) => item.type === product.type).slice(0, RELATED_LIMIT);
  const complementaryProducts = related.filter((item) => item.type !== product.type).slice(0, RELATED_LIMIT);

  const ratingRows = (ratingRowsRes.data ?? []) as Array<{ rating: number }>;
  const reviewsTotal = ratingRowsRes.count ?? ratingRows.length;
  const averageRating = ratingRows.length
    ? ratingRows.reduce((sum, review) => sum + Number(review.rating), 0) / ratingRows.length
    : null;
  const initialReviews = (initialReviewsRes.data ?? []) as PublicProductReview[];

  const productUrl = `${baseUrl}/sitio/${slug}/productos/${product.slug || product.id}`;
  const waHref = tenant.whatsapp_phone
    ? productInquiryHref(tenant.whatsapp_phone, product.name, productUrl)
    : null;
  const accentColor = tenant.theme_color?.trim() || DEFAULT_TENANT_ACCENT;
  const isService = product.type === "service";

  const customerDetails = [
    product.description ? { label: "Descripción", value: product.description, icon: null } : null,
    product.material_info ? { label: "Materiales", value: product.material_info, icon: Shirt } : null,
    product.care_instructions ? { label: "Cuidados", value: product.care_instructions, icon: Sparkles } : null,
    product.size_guide ? { label: "Referencia de medidas", value: product.size_guide, icon: Ruler } : null,
  ].filter((detail) => detail !== null);

  return (
    <div className="space-y-12 pb-[calc(10rem+env(safe-area-inset-bottom))] sm:space-y-16 md:pb-16">
      <div>
        <Link
          href={catalogHref(slug, { type: isService ? "service" : "product" })}
          className={`-ml-2 mb-2 inline-flex min-h-11 items-center gap-1 rounded-full px-2 text-sm font-medium text-(--store-ink-2) transition-colors hover:text-(--store-ink) ${storeFocusRing}`}
        >
          <ChevronLeft className="h-4 w-4" aria-hidden />
          {isService ? "Servicios" : "Productos"}
        </Link>

        <article
          className={`overflow-hidden rounded-(--store-radius) bg-white ring-1 ring-(--store-hairline) ${
            imageUrls.length > 0 ? "lg:grid lg:grid-cols-[minmax(0,1.1fr)_minmax(380px,0.9fr)]" : ""
          }`}
        >
          {imageUrls.length > 0 ? (
            <section className="relative min-w-0 bg-[#f5f5f7] p-2 sm:p-5 lg:p-7">
              {badgeText ? (
                <span className="absolute left-6 top-6 z-10 rounded-full bg-gray-950 px-3 py-1.5 text-xs font-semibold text-white">
                  {badgeText}
                </span>
              ) : null}
              <ProductImageGallery imageUrls={imageUrls} productName={product.name} accentColor={accentColor} />
            </section>
          ) : null}

          <section
            className={`min-w-0 px-5 py-7 sm:px-8 sm:py-9 lg:px-10 lg:py-12 ${imageUrls.length > 0 ? "" : "mx-auto max-w-2xl"}`}
          >
            {averageRating !== null ? (
              <a
                href="#resenas"
                className="inline-flex min-h-8 items-center gap-1.5 text-sm font-medium text-gray-700 hover:underline"
              >
                <Star className="h-4 w-4 text-gray-900" fill="currentColor" strokeWidth={0} aria-hidden />
                {averageRating.toFixed(1)}
                <span className="font-normal text-gray-500">
                  ({reviewsTotal} {reviewsTotal === 1 ? "reseña" : "reseñas"})
                </span>
              </a>
            ) : null}
            <h1
              className={`mt-2 max-w-xl text-3xl font-semibold leading-tight tracking-tight text-gray-950 sm:text-4xl lg:text-[44px] ${storeDisplayFont}`}
            >
              {product.name}
            </h1>

            <div className="mt-5 flex flex-wrap items-baseline gap-x-3 gap-y-1">
              <span id="product-price" className="text-3xl font-semibold tabular-nums tracking-tight text-gray-950">
                {formatCurrency(displayPrice)}
              </span>
              {showOriginalPrice ? (
                <span className="text-base tabular-nums text-gray-500 line-through">{formatCurrency(basePrice)}</span>
              ) : null}
            </div>
            {badgeText ? (
              <p className="mt-2 inline-flex items-center gap-1.5 text-sm text-gray-600">
                <Tag className="h-4 w-4" aria-hidden />
                Promoción aplicada en el precio
              </p>
            ) : null}

            {product.description ? (
              <p className="mt-5 line-clamp-3 whitespace-pre-line text-[17px] leading-relaxed text-gray-600 lg:max-w-prose">
                {product.description}
              </p>
            ) : null}

            <div className="mt-6 border-t border-gray-100 pt-1">
              <ProductDetailActions
                productId={product.id}
                tenantId={tenant.id}
                price={displayPrice}
                accentColor={accentColor}
                waHref={waHref}
              />
            </div>
          </section>
        </article>
      </div>

      {customerDetails.length > 0 ? (
        <section aria-labelledby="product-information-title" className="mx-auto max-w-3xl">
          <StoreSectionHeader id="product-information-title" title="Detalles" />
          <dl className="divide-y divide-(--store-hairline) border-y border-(--store-hairline)">
            {customerDetails.map(({ label, value, icon: Icon }) => (
              <div key={label} className="grid gap-2 py-5 sm:grid-cols-[180px_1fr] sm:gap-6">
                <dt className="flex items-center gap-2 text-[15px] font-semibold text-(--store-ink)">
                  {Icon ? <Icon className="h-4 w-4 text-(--store-ink-2)" aria-hidden /> : null}
                  {label}
                </dt>
                <dd className="whitespace-pre-line text-[15px] leading-relaxed text-(--store-ink-2)">{value}</dd>
              </div>
            ))}
          </dl>
        </section>
      ) : null}

      <div id="resenas" className="scroll-mt-24">
        <ProductReviewsList
          productId={product.id}
          initialReviews={initialReviews}
          total={reviewsTotal}
          averageRating={averageRating}
          accentColor={accentColor}
        />
      </div>

      <RelatedSection
        id="similar-title"
        title={isService ? "Servicios similares" : "También te puede gustar"}
        subtitle="Más opciones de este negocio."
        products={similarProducts}
        tenantId={tenant.id}
        slug={slug}
      />

      <RelatedSection
        id="complementary-title"
        title={isService ? "Completa tu visita" : "Servicios disponibles"}
        subtitle="Combínalo en el mismo pedido."
        products={complementaryProducts}
        tenantId={tenant.id}
        slug={slug}
      />
    </div>
  );
}
