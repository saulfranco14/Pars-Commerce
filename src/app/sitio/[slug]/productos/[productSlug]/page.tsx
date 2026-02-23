import { createAdminClient } from "@/lib/supabase/admin";
import { headers } from "next/headers";
import { notFound } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, ShieldCheck, Truck, RefreshCw, Tag } from "lucide-react";
import ProductDetailActions from "./ProductDetailActions";
import ProductImageGallery from "../ProductImageGallery";
import {
  buildProductPromoMap,
  type ProductPromotionResult,
  type PromotionForPrice,
} from "@/lib/promotionPrice";

interface PageProps {
  params: Promise<{ slug: string; productSlug: string }>;
}

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

function filterActivePromotions(
  rows: { valid_from?: string | null; valid_until?: string | null }[],
): unknown[] {
  const now = new Date();
  return rows.filter((p) => {
    const from = p.valid_from ? new Date(p.valid_from) : null;
    const until = p.valid_until ? new Date(p.valid_until) : null;
    if (from && from > now) return false;
    if (until && until < now) return false;
    return true;
  });
}

export default async function ProductoDetallePage({ params }: PageProps) {
  const { slug, productSlug } = await params;
  const supabase = createAdminClient();

  const { data: tenant, error: tenantError } = await supabase
    .from("tenants")
    .select("id, name, theme_color, whatsapp_phone")
    .eq("slug", slug)
    .single();

  if (tenantError || !tenant) {
    notFound();
  }

  const { data: product, error: productError } = await supabase
    .from("products")
    .select("id, name, slug, description, price, image_url")
    .eq("tenant_id", tenant.id)
    .eq("slug", productSlug)
    .eq("is_public", true)
    .is("deleted_at", null)
    .single();

  if (productError || !product) {
    notFound();
  }

  const [imagesRes, promosRes] = await Promise.all([
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
  ]);

  const images = imagesRes.data ?? [];
  const imageUrls =
    images.length > 0
      ? images.map((i) => i.url)
      : product.image_url
        ? [product.image_url]
        : [];

  type PromoRow = {
    id: string;
    type: string;
    value: number;
    quantity?: number | null;
    product_ids?: string[] | null;
    bundle_product_ids?: string[] | null;
    badge_label?: string | null;
  };
  const activePromos = filterActivePromotions(
    promosRes.data ?? [],
  ) as PromoRow[];
  const promosForPrice: PromotionForPrice[] = activePromos.map((p) => ({
    id: p.id,
    type: p.type,
    value: Number(p.value),
    quantity: p.quantity,
    product_ids: p.product_ids,
    bundle_product_ids: p.bundle_product_ids,
    badge_label: p.badge_label,
  }));
  const promoMap = buildProductPromoMap(
    promosForPrice,
    [product.id],
    new Map([[product.id, Number(product.price)]]),
  );
  const promotion: ProductPromotionResult | undefined = promoMap.get(
    product.id,
  );

  const displayPrice = promotion ? promotion.finalPrice : Number(product.price);
  const showOriginalPrice =
    promotion && promotion.finalPrice < Number(product.price);
  const badgeText = promotion?.discountPercent
    ? `-${promotion.discountPercent}%`
    : (promotion?.badgeLabel ?? null);

  const headersList = await headers();
  const host = headersList.get("host") ?? "";
  const protocol =
    headersList.get("x-forwarded-proto") === "https" ? "https" : "http";
  const baseUrl = host ? `${protocol}://${host}` : "";
  const productUrl = `${baseUrl}/sitio/${slug}/productos/${product.slug || product.id}`;
  const waHref = tenant.whatsapp_phone
    ? buildWhatsAppUrl(tenant.whatsapp_phone, product.name, productUrl)
    : null;

  const accentColor = tenant.theme_color?.trim() || "#6366f1";

  return (
    <div className="space-y-6">
      {/* Back link */}
      <Link
        href={`/sitio/${slug}/productos`}
        className="inline-flex items-center gap-2 rounded-lg px-3 text-sm font-medium text-gray-500 transition-all hover:bg-gray-100 hover:text-gray-900"
      >
        <ArrowLeft className="h-4 w-4" />
        Volver a productos
      </Link>

      {/* Main product card */}
      <div className="overflow-hidden rounded-3xl bg-white shadow-lg">
        <div className="lg:flex">
          {/* Image section */}
          <div className="relative w-full shrink-0 lg:w-3/5">
            {/* Discount badge overlay */}
            {badgeText && (
              <div className="absolute left-5 top-5 z-10 rounded-full bg-red-600 px-3 py-1.5 text-sm font-bold text-white shadow-lg">
                {badgeText}
              </div>
            )}
            <div className="p-5 sm:p-6">
              <ProductImageGallery
                imageUrls={imageUrls}
                productName={product.name}
                accentColor={accentColor}
              />
            </div>
          </div>

          {/* Details section */}
          <div className="flex flex-1 flex-col justify-between p-6 xl:p-10">
            <div>
              {/* Category / badge tag */}
              {badgeText && (
                <span
                  className="inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-semibold text-white"
                  style={{ backgroundColor: accentColor }}
                >
                  <Tag className="h-3 w-3" />
                  Promoción especial
                </span>
              )}

              {/* Product name */}
              <h1 className="mt-3 text-2xl font-extrabold leading-tight text-gray-900 sm:text-3xl xl:text-4xl">
                {product.name}
              </h1>

              {/* Price block */}
              <div className="mt-5 flex items-end gap-3">
                <span
                  className="text-4xl font-extrabold tracking-tight sm:text-5xl"
                  style={{ color: accentColor }}
                >
                  ${displayPrice.toFixed(2)}
                </span>
                {showOriginalPrice && (
                  <div className="mb-1 flex flex-col">
                    <span className="text-base text-gray-400 line-through">
                      ${Number(product.price).toFixed(2)}
                    </span>
                    <span className="text-xs font-semibold text-red-600">
                      Ahorra $
                      {(Number(product.price) - displayPrice).toFixed(2)}
                    </span>
                  </div>
                )}
              </div>

              {/* Description */}
              {product.description && (
                <div className="mt-5 border-t border-gray-100 pt-5">
                  <p className="text-base leading-relaxed text-gray-600 whitespace-pre-wrap">
                    {product.description}
                  </p>
                </div>
              )}
            </div>

            {/* CTA actions */}
            <div className="mt-8">
              <ProductDetailActions
                productId={product.id}
                tenantId={tenant.id}
                sitioSlug={slug}
                accentColor={accentColor}
                waHref={waHref}
              />

              {/* Trust badges */}
              <div className="mt-6 grid grid-cols-3 gap-3">
                <div
                  className="flex flex-col items-center gap-1.5 rounded-xl p-3 text-center"
                  style={{ backgroundColor: `${accentColor}10` }}
                >
                  <ShieldCheck
                    className="h-5 w-5"
                    style={{ color: accentColor }}
                  />
                  <span className="text-xs font-medium text-gray-600">
                    Pago seguro
                  </span>
                </div>
                <div
                  className="flex flex-col items-center gap-1.5 rounded-xl p-3 text-center"
                  style={{ backgroundColor: `${accentColor}10` }}
                >
                  <Truck className="h-5 w-5" style={{ color: accentColor }} />
                  <span className="text-xs font-medium text-gray-600">
                    Entrega rápida
                  </span>
                </div>
                <div
                  className="flex flex-col items-center gap-1.5 rounded-xl p-3 text-center"
                  style={{ backgroundColor: `${accentColor}10` }}
                >
                  <RefreshCw
                    className="h-5 w-5"
                    style={{ color: accentColor }}
                  />
                  <span className="text-xs font-medium text-gray-600">
                    Fácil devolución
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
