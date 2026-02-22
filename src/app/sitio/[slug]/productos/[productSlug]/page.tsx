import { createAdminClient } from "@/lib/supabase/admin";
import { headers } from "next/headers";
import { notFound } from "next/navigation";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
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

function buildWhatsAppUrl(phone: string, productName: string, productUrl: string): string {
  const text = encodeURIComponent(`Hola, me interesa: ${productName}\n${productUrl}`);
  const cleanPhone = phone.replace(/\D/g, "");
  return `https://wa.me/${cleanPhone}?text=${text}`;
}

function filterActivePromotions(
  rows: { valid_from?: string | null; valid_until?: string | null }[]
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
      .select("id, type, value, quantity, product_ids, bundle_product_ids, badge_label, valid_from, valid_until")
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
  const activePromos = filterActivePromotions(promosRes.data ?? []) as PromoRow[];
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
    new Map([[product.id, Number(product.price)]])
  );
  const promotion: ProductPromotionResult | undefined = promoMap.get(product.id);

  const displayPrice = promotion ? promotion.finalPrice : Number(product.price);
  const showOriginalPrice = promotion && promotion.finalPrice < Number(product.price);
  const badgeText = promotion?.discountPercent
    ? `-${promotion.discountPercent}%`
    : promotion?.badgeLabel ?? null;

  const headersList = await headers();
  const host = headersList.get("host") ?? "";
  const protocol = headersList.get("x-forwarded-proto") === "https" ? "https" : "http";
  const baseUrl = host ? `${protocol}://${host}` : "";
  const productUrl = `${baseUrl}/sitio/${slug}/productos/${product.slug || product.id}`;
  const waHref = tenant.whatsapp_phone
    ? buildWhatsAppUrl(tenant.whatsapp_phone, product.name, productUrl)
    : null;

  const accentColor = tenant.theme_color?.trim() || "#6366f1";

  return (
    <div className="space-y-6">
      <Link
        href={`/sitio/${slug}/productos`}
        className="inline-flex items-center gap-2 text-sm font-medium text-gray-600 transition-colors hover:text-gray-900"
      >
        <ArrowLeft className="h-4 w-4" />
        Volver a productos
      </Link>

      <div className="overflow-hidden rounded-2xl bg-white shadow-md sm:flex">
        <div className="relative w-full shrink-0 sm:w-96">
          <div className="p-4 sm:p-6">
            <ProductImageGallery
              imageUrls={imageUrls}
              productName={product.name}
              accentColor={accentColor}
            />
          </div>
          {badgeText && (
            <div
              className="absolute left-6 top-6 rounded-md px-3 py-1.5 text-sm font-bold text-white shadow-md"
              style={{ backgroundColor: "#dc2626" }}
            >
              {badgeText}
            </div>
          )}
          <div
            className="absolute right-6 top-6 rounded-lg px-4 py-2 text-lg font-bold text-white shadow-md"
            style={{ backgroundColor: accentColor }}
          >
            ${displayPrice.toFixed(2)}
          </div>
        </div>

        <div className="flex flex-1 flex-col p-6 sm:p-8">
          <h1 className="text-2xl font-bold text-gray-900 sm:text-3xl">
            {product.name}
          </h1>
          <div className="mt-3 flex items-center gap-2">
            {showOriginalPrice ? (
              <>
                <span
                  className="text-xl font-bold"
                  style={{ color: accentColor }}
                >
                  ${displayPrice.toFixed(2)}
                </span>
                <span className="text-base text-gray-400 line-through">
                  ${Number(product.price).toFixed(2)}
                </span>
              </>
            ) : (
              <span
                className="text-xl font-bold"
                style={{ color: accentColor }}
              >
                ${displayPrice.toFixed(2)}
              </span>
            )}
          </div>
          {product.description && (
            <div className="mt-4 flex-1">
              <p className="whitespace-pre-wrap text-gray-600">
                {product.description}
              </p>
            </div>
          )}

          <ProductDetailActions
            productId={product.id}
            tenantId={tenant.id}
            sitioSlug={slug}
            accentColor={accentColor}
            waHref={waHref}
          />
        </div>
      </div>
    </div>
  );
}
