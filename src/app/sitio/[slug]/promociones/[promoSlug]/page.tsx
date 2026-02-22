import { createAdminClient } from "@/lib/supabase/admin";
import { headers } from "next/headers";
import { notFound } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, MessageCircle, Tag, Package, FolderOpen } from "lucide-react";
import PromotionDetailActions from "./PromotionDetailActions";

interface PageProps {
  params: Promise<{ slug: string; promoSlug: string }>;
}

function buildWhatsAppUrl(phone: string, promoName: string, baseUrl: string): string {
  const text = encodeURIComponent(`Hola, me interesa la promoción: ${promoName}\n${baseUrl}`);
  const cleanPhone = phone.replace(/\D/g, "");
  return `https://wa.me/${cleanPhone}?text=${text}`;
}

function formatPromoValue(type: string, value: number, quantity?: number | null, badgeLabel?: string | null): string {
  const val = Number(value);
  if (type === "percentage") return `${val}% de descuento`;
  if (type === "fixed_amount") return `$${val.toFixed(2)} de descuento`;
  if (type === "bundle_price") return quantity ? `${quantity} por $${val.toFixed(2)}` : `$${val.toFixed(2)}`;
  if (type === "fixed_price") return `Precio especial $${val.toFixed(2)}`;
  if (type === "buy_x_get_y_free") return "Compra X, lleva Y gratis";
  if (type === "event_badge") return badgeLabel || "Promoción";
  return `$${val.toFixed(2)}`;
}

export default async function PromocionDetallePage({ params }: PageProps) {
  const { slug, promoSlug } = await params;
  const supabase = createAdminClient();

  const { data: tenant, error: tenantError } = await supabase
    .from("tenants")
    .select("id, name, theme_color, whatsapp_phone")
    .eq("slug", slug)
    .single();

  if (tenantError || !tenant) {
    notFound();
  }

  const { data: bySlug } = await supabase
    .from("promotions")
    .select("id, name, slug, type, value, quantity, min_amount, valid_from, valid_until, image_url, description, badge_label, product_ids, subcatalog_ids, bundle_product_ids, trigger_product_ids")
    .eq("tenant_id", tenant.id)
    .eq("slug", promoSlug)
    .maybeSingle();

  let promotion = bySlug;
  if (!promotion) {
    const { data: byId } = await supabase
      .from("promotions")
      .select("id, name, slug, type, value, quantity, min_amount, valid_from, valid_until, image_url, description, badge_label, product_ids, subcatalog_ids, bundle_product_ids, trigger_product_ids")
      .eq("tenant_id", tenant.id)
      .eq("id", promoSlug)
      .maybeSingle();
    promotion = byId ?? null;
  }
  if (!promotion) {
    notFound();
  }

  const { data: promoImages } = await supabase
    .from("promotion_images")
    .select("url, position")
    .eq("promotion_id", promotion.id)
    .order("position", { ascending: true });

  const allProductIds = [
    ...(promotion.product_ids ?? []),
    ...(promotion.bundle_product_ids ?? []),
    ...(promotion.trigger_product_ids ?? []),
  ].filter(Boolean);
  const uniqueProductIds = [...new Set(allProductIds)];

  const productsMap: Record<string, { id: string; name: string; slug: string | null; image_url: string | null; price: number }> = {};
  if (uniqueProductIds.length > 0) {
    const { data: products } = await supabase
      .from("products")
      .select("id, name, slug, image_url, price")
      .in("id", uniqueProductIds)
      .eq("is_public", true)
      .is("deleted_at", null);
    for (const prod of products ?? []) {
      productsMap[prod.id] = {
        id: prod.id,
        name: prod.name,
        slug: prod.slug,
        image_url: prod.image_url,
        price: Number(prod.price),
      };
    }
  }

  const subcatalogIds = (promotion.subcatalog_ids ?? []) as string[];
  const subcatalogsMap: Record<string, { id: string; name: string }> = {};
  if (subcatalogIds.length > 0) {
    const { data: subcatalogs } = await supabase
      .from("product_subcatalogs")
      .select("id, name")
      .in("id", subcatalogIds);
    for (const sc of subcatalogs ?? []) {
      subcatalogsMap[sc.id] = { id: sc.id, name: sc.name };
    }
  }

  const headersList = await headers();
  const host = headersList.get("host") ?? "";
  const protocol = headersList.get("x-forwarded-proto") === "https" ? "https" : "http";
  const baseUrl = host ? `${protocol}://${host}` : "";
  const promoUrl = `${baseUrl}/sitio/${slug}/promociones/${promotion.slug || promotion.id}`;
  const waHref = tenant.whatsapp_phone
    ? buildWhatsAppUrl(tenant.whatsapp_phone, promotion.name, promoUrl)
    : null;

  const accentColor = tenant.theme_color?.trim() || "#6366f1";
  const imageUrls = (promoImages ?? []).map((i) => i.url);
  const mainImage = promotion.image_url ?? imageUrls[0];
  const galleryImages = promotion.image_url ? imageUrls : imageUrls.slice(1);

  const products = uniqueProductIds.map((id) => productsMap[id]).filter(Boolean);
  const subcatalogs = subcatalogIds.map((id) => subcatalogsMap[id]).filter(Boolean);
  const hasAddableProducts =
    products.length > 0 &&
    ["percentage", "fixed_amount", "bundle_price", "fixed_price", "buy_x_get_y_free"].includes(
      promotion.type
    );

  return (
    <div className="space-y-6">
      <Link
        href={`/sitio/${slug}/promociones`}
        className="inline-flex items-center gap-2 text-sm font-medium text-gray-600 transition-colors hover:text-gray-900"
      >
        <ArrowLeft className="h-4 w-4" />
        Volver a promociones
      </Link>

      <div className="overflow-hidden rounded-2xl bg-white shadow-md">
        <div className="grid gap-6 sm:grid-cols-2">
          <div className="space-y-4">
            <div className="relative aspect-square overflow-hidden bg-gray-100">
              {mainImage ? (
                <img
                  src={mainImage}
                  alt={promotion.name}
                  className="h-full w-full object-cover"
                />
              ) : (
                <div className="flex h-full w-full items-center justify-center">
                  <Tag className="h-24 w-24 text-gray-300" />
                </div>
              )}
              {promotion.badge_label && (
                <div
                  className="absolute left-4 top-4 rounded-lg px-4 py-2 text-sm font-bold text-white shadow-md"
                  style={{ backgroundColor: accentColor }}
                >
                  {promotion.badge_label}
                </div>
              )}
              <div
                className="absolute right-4 top-4 rounded-lg px-4 py-2 text-lg font-bold text-white shadow-md"
                style={{ backgroundColor: accentColor }}
              >
                {formatPromoValue(promotion.type, Number(promotion.value), promotion.quantity, promotion.badge_label)}
              </div>
            </div>

            {galleryImages.length > 0 && (
              <div className="flex gap-2 overflow-x-auto">
                {galleryImages.map((url, i) => (
                  <img
                    key={i}
                    src={url}
                    alt={`${promotion.name} ${i + 2}`}
                    className="h-20 w-20 shrink-0 rounded-lg object-cover"
                  />
                ))}
              </div>
            )}
          </div>

          <div className="flex flex-col p-6 sm:p-8">
            <h1 className="text-2xl font-bold text-gray-900 sm:text-3xl">
              {promotion.name}
            </h1>

            {promotion.min_amount && (
              <p className="mt-2 text-sm text-gray-600">
                Compra mínima: ${Number(promotion.min_amount).toFixed(2)}
              </p>
            )}

            {(promotion.valid_from || promotion.valid_until) && (
              <p className="mt-1 text-sm text-gray-500">
                {promotion.valid_from && (
                  <span>
                    Desde {new Date(promotion.valid_from).toLocaleDateString("es-MX")}
                  </span>
                )}
                {promotion.valid_from && promotion.valid_until && " · "}
                {promotion.valid_until && (
                  <span>
                    Hasta {new Date(promotion.valid_until).toLocaleDateString("es-MX")}
                  </span>
                )}
              </p>
            )}

            {promotion.description && (
              <div className="mt-4 flex-1">
                <p className="whitespace-pre-wrap text-gray-600">
                  {promotion.description}
                </p>
              </div>
            )}

            <div className="mt-6 flex flex-col gap-3">
              <PromotionDetailActions
                promotionId={promotion.id}
                tenantId={tenant.id}
                sitioSlug={slug}
                accentColor={accentColor}
                hasAddableProducts={!!hasAddableProducts}
              />
              {waHref && (
                <a
                  href={waHref}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex cursor-pointer items-center justify-center gap-2 rounded-xl border-2 px-6 py-3 text-base font-medium transition-all hover:opacity-90"
                  style={{ borderColor: accentColor, color: accentColor }}
                >
                  <MessageCircle className="h-5 w-5" />
                  Consultar por WhatsApp
                </a>
              )}
            </div>
          </div>
        </div>
      </div>

      {products.length > 0 && (
        <section className="rounded-2xl bg-white p-6 shadow-sm">
          <h2 className="mb-4 flex items-center gap-2 text-lg font-semibold text-gray-900">
            <Package className="h-5 w-5" style={{ color: accentColor }} />
            Productos incluidos
          </h2>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {products.map((prod) => (
              <Link
                key={prod.id}
                href={`/sitio/${slug}/productos/${prod.slug || prod.id}`}
                className="group flex items-center gap-3 rounded-xl border p-3 transition-colors hover:border-gray-300"
              >
                <div className="h-16 w-16 shrink-0 overflow-hidden rounded-lg bg-gray-100">
                  {prod.image_url ? (
                    <img
                      src={prod.image_url}
                      alt={prod.name}
                      className="h-full w-full object-cover"
                    />
                  ) : (
                    <div className="flex h-full w-full items-center justify-center">
                      <Package className="h-8 w-8 text-gray-300" />
                    </div>
                  )}
                </div>
                <div className="min-w-0 flex-1">
                  <h3 className="font-medium text-gray-900 group-hover:text-gray-700 truncate">
                    {prod.name}
                  </h3>
                  <p className="text-sm font-semibold" style={{ color: accentColor }}>
                    ${prod.price.toFixed(2)}
                  </p>
                </div>
              </Link>
            ))}
          </div>
        </section>
      )}

      {subcatalogs.length > 0 && (
        <section className="rounded-2xl bg-white p-6 shadow-sm">
          <h2 className="mb-4 flex items-center gap-2 text-lg font-semibold text-gray-900">
            <FolderOpen className="h-5 w-5" style={{ color: accentColor }} />
            Subcatálogos incluidos
          </h2>
          <div className="flex flex-wrap gap-2">
            {subcatalogs.map((sc) => (
              <Link
                key={sc.id}
                href={`/sitio/${slug}/productos?subcatalog_id=${sc.id}`}
                className="inline-flex items-center rounded-full border px-4 py-2 text-sm font-medium transition-colors hover:opacity-90"
                style={{ borderColor: accentColor, color: accentColor }}
              >
                {sc.name}
              </Link>
            ))}
          </div>
        </section>
      )}
    </div>
  );
}
