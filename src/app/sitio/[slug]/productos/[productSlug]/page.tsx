/* eslint-disable @typescript-eslint/no-explicit-any -- Commerce schema types are regenerated after the migration rollout. */
import { createAdminClient } from "@/lib/supabase/admin";
import { headers } from "next/headers";
import { notFound } from "next/navigation";
import Link from "next/link";
import {
  ArrowLeft,
  BadgeCheck,
  PackageCheck,
  Ruler,
  Shirt,
  Sparkles,
  Tag,
} from "lucide-react";

import ProductCard from "../../ProductCard";
import ProductImageGallery from "../ProductImageGallery";
import ProductDetailActions from "./ProductDetailActions";
import ProductReviewsList, {
  type PublicProductReview,
} from "./ProductReviewsList";
import { enrichProducts, type ProductBase } from "@/lib/enrichProducts";
import {
  buildProductPromoMap,
  type ProductPromotionResult,
  type PromotionForPrice,
} from "@/lib/promotionPrice";
import { DEFAULT_TENANT_ACCENT } from "@/features/sitio-web/constants/templateStyles";

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

type PromoRow = {
  id: string;
  type: string;
  value: number;
  quantity?: number | null;
  product_ids?: string[] | null;
  bundle_product_ids?: string[] | null;
  badge_label?: string | null;
  valid_from?: string | null;
  valid_until?: string | null;
};

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

function filterActivePromotions(rows: PromoRow[]): PromoRow[] {
  const now = new Date();
  return rows.filter((promotion) => {
    const from = promotion.valid_from ? new Date(promotion.valid_from) : null;
    const until = promotion.valid_until
      ? new Date(promotion.valid_until)
      : null;
    if (from && from > now) return false;
    if (until && until < now) return false;
    return true;
  });
}

function RelatedRail({
  title,
  description,
  products,
  tenantId,
  sitioSlug,
  accentColor,
  whatsappPhone,
}: {
  title: string;
  description: string;
  products: ReturnType<typeof enrichProducts>;
  tenantId: string;
  sitioSlug: string;
  accentColor: string;
  whatsappPhone: string | null;
}) {
  if (products.length === 0) return null;

  return (
    <section
      aria-labelledby={`${title.replace(/\s+/g, "-").toLowerCase()}-title`}
    >
      <div className="mb-5 sm:flex sm:items-end sm:justify-between">
        <div>
          <h2
            id={`${title.replace(/\s+/g, "-").toLowerCase()}-title`}
            className="site-canvas-heading text-2xl font-bold tracking-[-0.025em] sm:text-3xl"
          >
            {title}
          </h2>
          <p className="site-canvas-copy mt-1 text-sm">{description}</p>
        </div>
      </div>
      <div className="-mx-4 flex snap-x snap-mandatory gap-3 overflow-x-auto scroll-px-4 px-4 pb-3 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden sm:mx-0 sm:grid sm:grid-cols-2 sm:overflow-visible sm:px-0 lg:grid-cols-4">
        {products.map((related) => (
          <div
            key={related.id}
            className="w-[72vw] max-w-[252px] shrink-0 snap-start sm:w-auto sm:max-w-none"
          >
            <ProductCard
              product={related}
              promotion={related.promotion}
              tenantId={tenantId}
              sitioSlug={sitioSlug}
              accentColor={accentColor}
              whatsappPhone={whatsappPhone}
              compact
            />
          </div>
        ))}
      </div>
    </section>
  );
}

export default async function ProductoDetallePage({ params }: PageProps) {
  const { slug, productSlug } = await params;
  const supabase = createAdminClient();
  const db = supabase as unknown as { from: (table: string) => any };

  const { data: tenant, error: tenantError } = await supabase
    .from("tenants")
    .select("id, name, theme_color, whatsapp_phone")
    .eq("site_slug", slug)
    .eq("public_store_enabled", true)
    .single();

  if (tenantError || !tenant) notFound();

  const { data: productData, error: productError } = await db
    .from("products")
    .select(
      "id, name, slug, description, price, image_url, subcatalog_id, type, has_variants, material_info, care_instructions, size_guide",
    )
    .eq("tenant_id", tenant.id)
    .eq("slug", productSlug)
    .eq("is_public", true)
    .is("deleted_at", null)
    .single();

  if (productError || !productData) notFound();
  const product = productData as ProductRow;

  const [imagesRes, promosRes, ratingRowsRes, initialReviewsRes, relatedRes] =
    await Promise.all([
      supabase
        .from("product_images")
        .select("url, position")
        .eq("product_id", product.id)
        .order("position", { ascending: true }),
      supabase
        .from("promotions")
        .select(
          "id, type, value, quantity, product_ids, bundle_product_ids, badge_label, valid_from, valid_until",
        )
        .eq("tenant_id", tenant.id),
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
      db
        .from("products")
        .select(
          "id, name, slug, description, price, image_url, subcatalog_id, type, has_variants",
        )
        .eq("tenant_id", tenant.id)
        .eq("is_public", true)
        .is("deleted_at", null)
        .neq("id", product.id)
        .limit(16),
    ]);

  const images = imagesRes.data ?? [];
  const imageUrls = images.length
    ? images.map((image) => image.url)
    : product.image_url
      ? [product.image_url]
      : [];

  const activePromos = filterActivePromotions(
    (promosRes.data ?? []) as PromoRow[],
  );
  const promosForPrice: PromotionForPrice[] = activePromos.map((promotion) => ({
    id: promotion.id,
    type: promotion.type,
    value: Number(promotion.value),
    quantity: promotion.quantity,
    product_ids: promotion.product_ids,
    bundle_product_ids: promotion.bundle_product_ids,
    badge_label: promotion.badge_label,
  }));
  const promoMap = buildProductPromoMap(
    promosForPrice,
    [product.id],
    new Map([[product.id, Number(product.price)]]),
  );
  const promotion: ProductPromotionResult | undefined = promoMap.get(
    product.id,
  );
  const displayPrice = promotion?.finalPrice ?? Number(product.price);
  const showOriginalPrice = displayPrice < Number(product.price);
  const badgeText = promotion?.discountPercent
    ? `-${promotion.discountPercent}%`
    : (promotion?.badgeLabel ?? null);

  const relatedRows = (relatedRes.data ?? []) as ProductRow[];
  const relatedIds = relatedRows.map((related) => related.id);
  const relatedImages = relatedIds.length
    ? ((
        await supabase
          .from("product_images")
          .select("product_id, url, position")
          .in("product_id", relatedIds)
          .order("position", { ascending: true })
      ).data ?? [])
    : [];
  const enrichedRelated = enrichProducts(
    relatedRows,
    relatedImages,
    promosForPrice,
  ).sort((left, right) => {
    const leftSameCategory =
      left.subcatalog_id === product.subcatalog_id ? 0 : 1;
    const rightSameCategory =
      right.subcatalog_id === product.subcatalog_id ? 0 : 1;
    if (leftSameCategory !== rightSameCategory)
      return leftSameCategory - rightSameCategory;
    return left.name.localeCompare(right.name, "es-MX");
  });
  const similarProducts = enrichedRelated
    .filter((related) => related.type === product.type)
    .slice(0, 4);
  const complementaryProducts = enrichedRelated
    .filter((related) => related.type !== product.type)
    .slice(0, 4);

  const ratingRows = (ratingRowsRes.data ?? []) as Array<{ rating: number }>;
  const reviewsTotal = ratingRowsRes.count ?? ratingRows.length;
  const averageRating = ratingRows.length
    ? ratingRows.reduce((sum, review) => sum + Number(review.rating), 0) /
      ratingRows.length
    : null;
  const initialReviews = (initialReviewsRes.data ??
    []) as PublicProductReview[];

  const headersList = await headers();
  const host = headersList.get("host") ?? "";
  const protocol =
    headersList.get("x-forwarded-proto") === "https" ? "https" : "http";
  const baseUrl = host ? `${protocol}://${host}` : "";
  const productUrl = `${baseUrl}/sitio/${slug}/productos/${product.slug || product.id}`;
  const waHref = tenant.whatsapp_phone
    ? buildWhatsAppUrl(tenant.whatsapp_phone, product.name, productUrl)
    : null;
  const accentColor = tenant.theme_color?.trim() || DEFAULT_TENANT_ACCENT;

  const customerDetails = [
    product.material_info
      ? { label: "Materiales", value: product.material_info, icon: Shirt }
      : null,
    product.care_instructions
      ? {
          label: "Cuidados",
          value: product.care_instructions,
          icon: Sparkles,
        }
      : null,
    product.size_guide
      ? {
          label: "Referencia de medidas",
          value: product.size_guide,
          icon: Ruler,
        }
      : null,
  ].filter(Boolean) as Array<{
    label: string;
    value: string;
    icon: typeof Shirt;
  }>;

  return (
    <div className="space-y-9 pb-[calc(10rem+env(safe-area-inset-bottom))] sm:space-y-12 md:pb-16">
      <Link
        href={`/sitio/${slug}/productos`}
        className="site-canvas-copy inline-flex min-h-11 mb-2 items-center gap-2 rounded-xl px-2 text-sm font-semibold transition-colors hover:bg-white hover:text-gray-950"
      >
        <ArrowLeft className="h-4 w-4" aria-hidden />
        Seguir comprando
      </Link>

      <article className="overflow-hidden rounded-[28px] border border-gray-200 bg-white shadow-[0_20px_55px_-40px_rgba(15,23,42,0.4)] lg:grid lg:grid-cols-[minmax(0,1.08fr)_minmax(390px,0.92fr)] lg:items-stretch">
        <section className="relative min-w-0 bg-[#f4f5f7] p-2 sm:p-5 lg:p-7">
          {badgeText ? (
            <span className="absolute left-6 top-6 z-10 rounded-full bg-red-600 px-3 py-1.5 text-xs font-bold text-white shadow-md">
              {badgeText}
            </span>
          ) : null}
          <ProductImageGallery
            imageUrls={imageUrls}
            productName={product.name}
            accentColor={accentColor}
          />
        </section>

        <section className="min-w-0 border-t border-gray-100 px-5 py-7 sm:px-8 sm:py-9 lg:border-l lg:border-t-0 lg:px-10 lg:py-12">
          <div className="flex flex-wrap items-center gap-x-3 gap-y-2">
            <p className="text-[11px] font-bold uppercase tracking-[0.14em] text-gray-500">
              {product.type === "service" ? "Servicio" : "Producto"}
            </p>
            {averageRating !== null ? (
              <a
                href="#resenas"
                className="inline-flex items-center gap-1.5 text-xs font-semibold text-gray-700"
              >
                <span className="text-amber-500" aria-hidden>
                  ★
                </span>
                {averageRating.toFixed(1)}
                <span className="font-normal text-gray-500">
                  ({reviewsTotal})
                </span>
              </a>
            ) : null}
          </div>
          <h1 className="mt-3 max-w-xl text-[2rem] font-bold leading-[1.08] tracking-[-0.035em] text-gray-950 sm:text-4xl lg:text-[2.75rem]">
            {product.name}
          </h1>

          <div className="mt-6 flex flex-wrap items-end gap-x-3 gap-y-1">
            <span
              id="product-price"
              className="text-[2.5rem] font-bold tracking-[-0.04em]"
              style={{ color: accentColor }}
            >
              ${displayPrice.toFixed(2)}
            </span>
            {showOriginalPrice ? (
              <span className="pb-1 text-base text-gray-400 line-through">
                ${Number(product.price).toFixed(2)}
              </span>
            ) : null}
          </div>

          {badgeText ? (
            <p className="mt-3 inline-flex items-center gap-2 rounded-full bg-red-50 px-3 py-1.5 text-xs font-semibold text-red-700">
              <Tag className="h-3.5 w-3.5" aria-hidden />
              Promoción aplicada
            </p>
          ) : null}

          {product.description ? (
            <p className="mt-6 line-clamp-3 whitespace-pre-wrap text-base leading-7 text-gray-600 lg:max-w-prose">
              {product.description}
            </p>
          ) : null}

          <div className="mt-7 border-t border-gray-100 pt-1">
            <ProductDetailActions
              productId={product.id}
              tenantId={tenant.id}
              price={displayPrice}
              accentColor={accentColor}
              waHref={waHref}
            />
          </div>

          <div className="mt-6 grid grid-cols-3 divide-x divide-gray-100 border-t border-gray-100 pt-5">
            <div className="px-2 text-center first:pl-0 sm:text-left">
              <BadgeCheck
                className="h-5 w-5"
                style={{ color: accentColor }}
                aria-hidden
              />
              <p className="mt-2 text-[11px] font-semibold leading-4 text-gray-700 sm:text-xs">
                Compra protegida
              </p>
            </div>
            <div className="px-2 text-center sm:px-3 sm:text-left">
              <PackageCheck
                className="h-5 w-5"
                style={{ color: accentColor }}
                aria-hidden
              />
              <p className="mt-2 text-[11px] font-semibold leading-4 text-gray-700 sm:text-xs">
                Sigue tu pedido
              </p>
            </div>
            <div className="px-2 text-center last:pr-0 sm:pl-3 sm:text-left">
              <Sparkles
                className="h-5 w-5"
                style={{ color: accentColor }}
                aria-hidden
              />
              <p className="mt-2 text-[11px] font-semibold leading-4 text-gray-700 sm:text-xs">
                Atención directa
              </p>
            </div>
          </div>
        </section>
      </article>

      {product.description || customerDetails.length > 0 ? (
        <section
          aria-labelledby="product-information-title"
          className="grid overflow-hidden rounded-[28px] border border-gray-200 bg-white shadow-sm lg:grid-cols-[0.72fr_1.28fr]"
        >
          <div className="bg-gray-950 px-5 py-7 text-white sm:px-7 sm:py-9 lg:px-9 lg:py-10">
            <p className="text-[11px] font-bold uppercase tracking-[0.14em] text-white/55">
              Detalles del artículo
            </p>
            <h2
              id="product-information-title"
              className="mt-2 text-2xl font-bold tracking-[-0.025em] sm:text-3xl"
            >
              Lo importante antes de elegir.
            </h2>
            <p className="mt-3 text-sm leading-6 text-white/65">
              Descripción, materiales y cuidados reunidos para decidir con
              claridad.
            </p>
          </div>
          <div className="grid gap-px bg-gray-200 sm:grid-cols-2">
            {product.description ? (
              <article
                className={`bg-white p-5 sm:p-6 ${customerDetails.length === 0 ? "sm:col-span-2" : ""}`}
              >
                <h3 className="text-sm font-bold text-gray-950">Descripción</h3>
                <p className="mt-3 whitespace-pre-wrap text-sm leading-6 text-gray-600">
                  {product.description}
                </p>
              </article>
            ) : null}

            {customerDetails.map(({ label, value, icon: Icon }) => (
              <article key={label} className="bg-white p-5 sm:p-6">
                <div className="flex items-center gap-3">
                  <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-gray-50">
                    <Icon
                      className="h-4 w-4"
                      style={{ color: accentColor }}
                      aria-hidden
                    />
                  </span>
                  <h3 className="text-sm font-bold text-gray-950">{label}</h3>
                </div>
                <p className="mt-3 whitespace-pre-wrap text-sm leading-6 text-gray-600">
                  {value}
                </p>
              </article>
            ))}
          </div>
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

      <RelatedRail
        title={
          product.type === "service"
            ? "Servicios similares"
            : "También te puede gustar"
        }
        description="Más opciones disponibles en este negocio."
        products={similarProducts}
        tenantId={tenant.id}
        sitioSlug={slug}
        accentColor={accentColor}
        whatsappPhone={tenant.whatsapp_phone}
      />

      <RelatedRail
        title={
          product.type === "service"
            ? "Productos para completar tu visita"
            : "Servicios disponibles"
        }
        description="Combina tu compra con otras opciones del mismo negocio."
        products={complementaryProducts}
        tenantId={tenant.id}
        sitioSlug={slug}
        accentColor={accentColor}
        whatsappPhone={tenant.whatsapp_phone}
      />
    </div>
  );
}
