import { createAdminClient } from "@/lib/supabase/admin";
import { headers } from "next/headers";
import { notFound } from "next/navigation";
import Link from "next/link";
import { Tag, Gift, ArrowRight, Package } from "lucide-react";
import PromotionCard from "./PromotionCard";
import ProductCard from "../ProductCard";
import { enrichProducts } from "@/lib/enrichProducts";
import type { PromotionForPrice } from "@/lib/promotionPrice";

export const dynamic = "force-dynamic";

interface PageProps {
  params: Promise<{ slug: string }>;
}

export default async function PromocionesPage({ params }: PageProps) {
  const { slug } = await params;
  const headersList = await headers();
  const host = headersList.get("host") ?? "";
  const protocol = headersList.get("x-forwarded-proto") === "https" ? "https" : "http";
  const baseUrl = host ? `${protocol}://${host}` : "";
  const supabase = createAdminClient();

  const { data: tenant, error: tenantError } = await supabase
    .from("tenants")
    .select("id, name, theme_color, whatsapp_phone")
    .eq("slug", slug)
    .single();

  if (tenantError || !tenant) {
    notFound();
  }

  const { data: promotions } = await supabase
    .from("promotions")
    .select("id, name, slug, type, value, quantity, min_amount, valid_from, valid_until, image_url, badge_label, product_ids, bundle_product_ids")
    .eq("tenant_id", tenant.id)
    .order("created_at", { ascending: false });

  const now = new Date();
  const promoList = promotions ?? [];
  const active = promoList.filter((p) => {
    const from = p.valid_from ? new Date(p.valid_from) : null;
    const until = p.valid_until ? new Date(p.valid_until) : null;
    if (from && from > now) return false;
    if (until && until < now) return false;
    return true;
  });

  const allProductIds = [
    ...new Set(
      active.flatMap((p) => [
        ...(p.product_ids ?? []),
        ...(p.bundle_product_ids ?? []),
      ].filter(Boolean) as string[])
    ),
  ];

  let promoProducts: ReturnType<typeof enrichProducts> = [];
  if (allProductIds.length > 0) {
    const [productsRes, imagesRes] = await Promise.all([
      supabase
        .from("products")
        .select("id, name, slug, description, price, image_url, subcatalog_id")
        .in("id", allProductIds)
        .eq("tenant_id", tenant.id)
        .eq("is_public", true)
        .is("deleted_at", null),
      supabase
        .from("product_images")
        .select("product_id, url, position")
        .in("product_id", allProductIds),
    ]);
    const products = productsRes.data ?? [];
    const images = imagesRes.data ?? [];
    const promosForPrice: PromotionForPrice[] = active.map((p) => ({
      id: p.id,
      type: p.type,
      value: Number(p.value),
      quantity: p.quantity,
      product_ids: p.product_ids,
      bundle_product_ids: p.bundle_product_ids,
      badge_label: p.badge_label,
    }));
    promoProducts = enrichProducts(
      products.map((p) => ({
        id: p.id,
        name: p.name,
        slug: p.slug,
        description: p.description,
        price: Number(p.price),
        image_url: p.image_url,
      })),
      images,
      promosForPrice
    );
  }

  const accentColor = tenant.theme_color?.trim() || "#6366f1";

  return (
    <div className="space-y-10">
      <div className="flex items-center gap-3">
        <div
          className="flex h-10 w-10 items-center justify-center rounded-xl text-white"
          style={{ backgroundColor: accentColor }}
        >
          <Tag className="h-5 w-5" />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-gray-900 sm:text-3xl">
            Promociones
          </h1>
          <p className="mt-0.5 text-sm text-gray-500">
            Aprovecha nuestras ofertas especiales
          </p>
        </div>
      </div>

      {active.length === 0 ? (
        <div className="rounded-2xl bg-white py-16 text-center shadow-sm">
          <Gift className="mx-auto h-12 w-12 text-gray-300" />
          <p className="mt-4 text-gray-500">
            No hay promociones vigentes en este momento.
          </p>
          <p className="mt-1 text-sm text-gray-400">
            Vuelve pronto para nuevas ofertas
          </p>
        </div>
      ) : (
        <>
          <section>
            <h2 className="mb-4 text-lg font-semibold text-gray-900">
              Ofertas destacadas
            </h2>
            <div className="-mx-4 flex snap-x snap-mandatory gap-4 overflow-x-auto px-4 pb-2 sm:mx-0 sm:grid sm:snap-none sm:grid-cols-2 sm:overflow-visible lg:grid-cols-3">
              {active.map((p) => {
                const productIds = [...(p.product_ids ?? []), ...(p.bundle_product_ids ?? [])].filter(Boolean);
                const hasAddable = productIds.length > 0 && ["percentage", "fixed_amount", "bundle_price", "fixed_price"].includes(p.type);
                return (
                  <div
                    key={p.id}
                    className="min-w-[85vw] snap-center sm:min-w-0"
                  >
                    <PromotionCard
                      promotion={{
                        id: p.id,
                        name: p.name,
                        slug: p.slug,
                        type: p.type,
                        value: Number(p.value),
                        quantity: p.quantity,
                        min_amount: p.min_amount,
                        valid_until: p.valid_until,
                        image_url: p.image_url,
                        badge_label: p.badge_label,
                      }}
                      tenantId={tenant.id}
                      sitioSlug={slug}
                      accentColor={accentColor}
                      hasAddableProducts={hasAddable}
                    />
                  </div>
                );
              })}
            </div>
          </section>

          {promoProducts.length > 0 && (
            <section className="rounded-2xl bg-white p-6 shadow-sm">
              <div className="mb-4 flex items-center justify-between">
                <h2 className="flex items-center gap-2 text-lg font-semibold text-gray-900">
                  <Package className="h-5 w-5" style={{ color: accentColor }} />
                  Productos en promoción
                </h2>
                <Link
                  href={`/sitio/${slug}/productos`}
                  className="inline-flex items-center gap-1 text-sm font-medium transition-colors hover:opacity-80"
                  style={{ color: accentColor }}
                >
                  Ver todos <ArrowRight className="h-4 w-4" />
                </Link>
              </div>
              <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
                {promoProducts.map((item) => (
                  <ProductCard
                    key={item.id}
                    product={item}
                    promotion={item.promotion}
                    tenantId={tenant.id}
                    sitioSlug={slug}
                    accentColor={accentColor}
                    whatsappPhone={tenant.whatsapp_phone ?? null}
                    baseUrl={baseUrl}
                  />
                ))}
              </div>
            </section>
          )}
        </>
      )}
    </div>
  );
}
