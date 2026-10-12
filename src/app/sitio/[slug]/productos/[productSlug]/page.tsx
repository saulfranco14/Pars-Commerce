import { createAdminClient } from "@/lib/supabase/admin";
import { headers } from "next/headers";
import { notFound } from "next/navigation";
import Link from "next/link";
import {
  ArrowLeft,
  BadgeCheck,
  ChevronDown,
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
      <div className="mb-4 sm:flex sm:items-end sm:justify-between">
        <div>
          <h2
            id={`${title.replace(/\s+/g, "-").toLowerCase()}-title`}
            className="text-2xl font-bold tracking-tight text-gray-950"
          >
            {title}
          </h2>
          <p className="mt-1 text-sm text-gray-500">{description}</p>
        </div>
      </div>
      <div className="-mx-4 flex snap-x snap-mandatory gap-3 overflow-x-auto px-4 pb-3 sm:mx-0 sm:grid sm:grid-cols-2 sm:overflow-visible sm:px-0 lg:grid-cols-4">
        {products.map((related) => (
          <div
            key={related.id}
            className="w-[78vw] max-w-[290px] shrink-0 snap-start sm:w-auto sm:max-w-none"
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
    <div className="space-y-10 pb-10 sm:space-y-14 sm:pb-14">
      <Link
        href={`/sitio/${slug}/productos`}
        className="inline-flex min-h-11 items-center gap-2 rounded-xl px-2 text-sm font-semibold text-gray-600 transition-colors hover:bg-gray-100 hover:text-gray-950 mb-2"
      >
        <ArrowLeft className="h-4 w-4" aria-hidden />
        Volver al catálogo
      </Link>

      <article className="overflow-hidden rounded-[28px] border border-gray-200 bg-white shadow-sm lg:grid lg:grid-cols-[minmax(0,0.98fr)_minmax(420px,0.82fr)] lg:items-stretch">
        <section className="relative min-w-0 bg-gray-50 p-3 sm:p-5 lg:p-6">
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

        <section className="min-w-0 border-t border-gray-100 px-5 py-6 sm:px-7 sm:py-8 lg:border-l lg:border-t-0 lg:px-9 lg:py-10">
          <p className="text-xs font-semibold uppercase tracking-[0.12em] text-gray-500">
            {product.type === "service" ? "Servicio" : "Producto"}
          </p>
          <h1 className="mt-2 max-w-xl text-3xl font-bold leading-tight tracking-tight text-gray-950 sm:text-4xl lg:text-[2.6rem]">
            {product.name}
          </h1>

          {averageRating !== null ? (
            <a
              href="#resenas"
              className="mt-3 inline-flex min-h-9 items-center gap-2 rounded-lg text-sm font-semibold text-gray-700"
            >
              <span className="text-amber-500" aria-hidden>
                ★
              </span>
              {averageRating.toFixed(1)}
              <span className="font-normal text-gray-500">
                · {reviewsTotal} {reviewsTotal === 1 ? "reseña" : "reseñas"}
              </span>
            </a>
          ) : null}

          <div className="mt-5 flex flex-wrap items-end gap-x-3 gap-y-1">
            <span
              className="text-4xl font-bold tracking-tight"
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
            <p className="mt-5 whitespace-pre-wrap text-base leading-7 text-gray-600 lg:max-w-prose">
              {product.description}
            </p>
          ) : null}

          <div className="mt-8">
            <ProductDetailActions
              productId={product.id}
              tenantId={tenant.id}
              accentColor={accentColor}
              waHref={waHref}
            />
          </div>

          <div className="mt-6 grid grid-cols-2 gap-2 sm:grid-cols-3 lg:mt-8">
            <div className="rounded-xl border border-gray-100 bg-gray-50 p-3">
              <BadgeCheck
                className="h-5 w-5"
                style={{ color: accentColor }}
                aria-hidden
              />
              <p className="mt-2 text-xs font-semibold text-gray-700">
                Compra registrada
              </p>
            </div>
            <div className="rounded-xl border border-gray-100 bg-gray-50 p-3">
              <PackageCheck
                className="h-5 w-5"
                style={{ color: accentColor }}
                aria-hidden
              />
              <p className="mt-2 text-xs font-semibold text-gray-700">
                Seguimiento del pedido
              </p>
            </div>
            <div className="col-span-2 rounded-xl border border-gray-100 bg-gray-50 p-3 sm:col-span-1">
              <Sparkles
                className="h-5 w-5"
                style={{ color: accentColor }}
                aria-hidden
              />
              <p className="mt-2 text-xs font-semibold text-gray-700">
                Atención del negocio
              </p>
            </div>
          </div>
        </section>
      </article>

      {product.description || customerDetails.length > 0 ? (
        <section
          aria-labelledby="product-information-title"
          className="rounded-[28px] bg-gray-50 p-4 sm:p-6"
        >
          <h2
            id="product-information-title"
            className="text-2xl font-bold tracking-tight text-gray-950"
          >
            Conoce lo que estás eligiendo
          </h2>
          <div className="mt-4 grid gap-3 lg:grid-cols-2">
            {product.description ? (
              <details
                className="group rounded-2xl border border-gray-200 bg-white shadow-sm"
                open
              >
                <summary className="flex min-h-14 cursor-pointer list-none items-center justify-between gap-3 px-4 font-semibold text-gray-950 sm:px-5">
                  Descripción
                  <ChevronDown
                    className="h-5 w-5 text-gray-400 transition-transform group-open:rotate-180"
                    aria-hidden
                  />
                </summary>
                <p className="border-t border-gray-100 px-4 py-4 whitespace-pre-wrap text-sm leading-6 text-gray-600 sm:px-5">
                  {product.description}
                </p>
              </details>
            ) : null}

            {customerDetails.length > 0 ? (
              <details className="group rounded-2xl border border-gray-200 bg-white shadow-sm">
                <summary className="flex min-h-14 cursor-pointer list-none items-center justify-between gap-3 px-4 font-semibold text-gray-950 sm:px-5">
                  Materiales, cuidados y medidas
                  <ChevronDown
                    className="h-5 w-5 text-gray-400 transition-transform group-open:rotate-180"
                    aria-hidden
                  />
                </summary>
                <dl className="space-y-4 border-t border-gray-100 px-4 py-4 sm:px-5">
                  {customerDetails.map(({ label, value, icon: Icon }) => (
                    <div key={label} className="flex gap-3">
                      <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-gray-50">
                        <Icon
                          className="h-4 w-4"
                          style={{ color: accentColor }}
                          aria-hidden
                        />
                      </span>
                      <div>
                        <dt className="text-sm font-semibold text-gray-950">
                          {label}
                        </dt>
                        <dd className="mt-1 whitespace-pre-wrap text-sm leading-6 text-gray-600">
                          {value}
                        </dd>
                      </div>
                    </div>
                  ))}
                </dl>
              </details>
            ) : null}
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
