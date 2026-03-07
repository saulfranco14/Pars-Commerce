import { createAdminClient } from "@/lib/supabase/admin";
import { headers } from "next/headers";
import { notFound } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import {
  ArrowRight,
  ShoppingBag,
  Sparkles,
  ShoppingCart,
  MessageCircle,
  Package,
  Tag,
} from "lucide-react";
import type {
  SitePageCard,
  SitePagePurchaseStep,
  SitePageFaqItem,
} from "@/types/tenantSitePages";
import ProductCard from "../ProductCard";
import PromotionCard from "../promociones/PromotionCard";
import { enrichProducts } from "@/lib/enrichProducts";
import type { PromotionForPrice } from "@/lib/promotionPrice";
import {
  ICON_MAP,
  DEFAULT_CARDS,
  DEFAULT_PURCHASE_STEPS,
} from "@/features/sitio/constants/inicio";

interface PageProps {
  params: Promise<{ slug: string }>;
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

export default async function InicioPage({ params }: PageProps) {
  const { slug } = await params;
  const headersList = await headers();
  const host = headersList.get("host") ?? "";
  const protocol = headersList.get("x-forwarded-proto") === "https" ? "https" : "http";
  const baseUrl = host ? `${protocol}://${host}` : "";
  const supabase = createAdminClient();

  const { data: tenant, error: tenantError } = await supabase
    .from("tenants")
    .select("id, name, description, theme_color, whatsapp_phone")
    .eq("slug", slug)
    .single();

  if (tenantError || !tenant) {
    notFound();
  }

  const [pageRes, productsRes, promosRes] = await Promise.all([
    supabase
      .from("tenant_site_pages")
      .select("content")
      .eq("tenant_id", tenant.id)
      .eq("slug", "inicio")
      .eq("is_enabled", true)
      .single(),
    supabase
      .from("products")
      .select("id, name, slug, description, price, image_url, subcatalog_id")
      .eq("tenant_id", tenant.id)
      .eq("is_public", true)
      .is("deleted_at", null)
      .order("created_at", { ascending: false })
      .limit(6),
    supabase
      .from("promotions")
      .select("id, name, slug, type, value, quantity, min_amount, product_ids, bundle_product_ids, badge_label, valid_from, valid_until, image_url")
      .eq("tenant_id", tenant.id)
      .order("created_at", { ascending: false }),
  ]);

  const products = productsRes.data ?? [];
  const productIds = products.map((p) => p.id);
  const { data: imagesData } =
    productIds.length > 0
      ? await supabase
          .from("product_images")
          .select("product_id, url, position")
          .in("product_id", productIds)
      : { data: [] };
  const images = imagesData ?? [];
  const activePromos = filterActivePromotions(promosRes.data ?? []) as NonNullable<typeof promosRes.data>;
  const promosForPrice: PromotionForPrice[] = (activePromos ?? []).map((p) => ({
    id: p.id,
    type: p.type,
    value: Number(p.value),
    quantity: p.quantity,
    product_ids: p.product_ids,
    bundle_product_ids: p.bundle_product_ids,
    badge_label: p.badge_label,
  }));
  const featuredProducts = enrichProducts(
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

  const { data: page } = pageRes;

  const rawContent = (page?.content as Record<string, unknown> | null) ?? {};
  const cards =
    (rawContent.cards as SitePageCard[] | undefined)?.filter((c) => c?.title) ??
    DEFAULT_CARDS;
  const purchaseProcess =
    (rawContent.purchase_process as SitePagePurchaseStep[] | undefined)?.filter(
      (s) => s?.title,
    ) ?? DEFAULT_PURCHASE_STEPS;
  const deliveryBannerText = (rawContent.delivery_banner_text as string) ?? "";
  const faqItems =
    (rawContent.faq_items as SitePageFaqItem[] | undefined)?.filter(
      (f) => f?.question,
    ) ?? [];
  const content = rawContent as Record<string, string>;
  const accentColor = tenant.theme_color?.trim() || "#6366f1";

  return (
    <div className="space-y-12">
      {/* ── Hero ── */}
      <section
        className="relative overflow-hidden rounded-3xl shadow-xl"
        style={{
          background: content.hero_image_url
            ? undefined
            : `linear-gradient(135deg, ${accentColor}, ${accentColor}cc, ${accentColor}88)`,
        }}
      >
        {content.hero_image_url && (
          <div className="absolute inset-0">
            <Image
              src={content.hero_image_url}
              alt=""
              fill
              sizes="100vw"
              className="object-cover"
              priority
              quality={80}
            />
            <div className="absolute inset-0 bg-black/50" />
          </div>
        )}

        <div className="relative z-10 flex min-h-[45vh] flex-col justify-end px-8 pb-12 pt-20 sm:min-h-[55vh] sm:px-14 sm:pb-16">
          <div className="max-w-2xl">
            <h1 className="text-4xl font-extrabold leading-tight tracking-tight text-white sm:text-6xl">
              {content.title || `Bienvenido a ${tenant.name}`}
            </h1>

            {(content.subtitle || tenant.description) && (
              <p className="mt-4 max-w-xl text-lg text-white/80 sm:text-xl">
                {content.subtitle || tenant.description}
              </p>
            )}

            <div className="mt-8 flex flex-wrap gap-3">
              <Link
                href={`/sitio/${slug}/productos`}
                className="inline-flex cursor-pointer items-center gap-2 rounded-2xl bg-white px-6 py-3.5 text-sm font-bold shadow-lg transition-all hover:scale-105 hover:shadow-xl"
                style={{ color: accentColor }}
              >
                <ShoppingBag className="h-4 w-4" />
                Ver productos
                <ArrowRight className="h-4 w-4" />
              </Link>
              <Link
                href={`/sitio/${slug}/promociones`}
                className="inline-flex cursor-pointer items-center gap-2 rounded-2xl border-2 border-white/40 bg-white/15 px-6 py-3.5 text-sm font-bold text-white backdrop-blur-sm transition-all hover:bg-white/25"
              >
                <Sparkles className="h-4 w-4" />
                Promociones
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* ── Featured Products ── */}
      {featuredProducts.length > 0 && (
        <section>
          <div className="mb-6 flex items-end justify-between">
            <div>
              <h2 className="text-2xl font-extrabold text-gray-900 sm:text-3xl">
                Productos destacados
              </h2>
              <p className="mt-1 text-sm text-gray-500">Lo más popular de nuestro catálogo</p>
            </div>
            <Link
              href={`/sitio/${slug}/productos`}
              className="hidden sm:inline-flex items-center gap-1.5 rounded-xl border px-4 py-2 text-sm font-semibold transition-all hover:shadow-sm"
              style={{ borderColor: `${accentColor}40`, color: accentColor }}
            >
              Ver todos <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
          {/* Horizontal scroll on mobile, grid on sm+ */}
          <div className="-mx-4 flex snap-x snap-mandatory gap-4 overflow-x-auto px-4 pb-3 sm:mx-0 sm:grid sm:snap-none sm:grid-cols-2 sm:overflow-visible lg:grid-cols-3">
            {featuredProducts.map((item, idx) => (
              <div key={item.id} className="min-w-[78vw] snap-center sm:min-w-0">
                <ProductCard
                  product={item}
                  promotion={item.promotion}
                  tenantId={tenant.id}
                  sitioSlug={slug}
                  accentColor={accentColor}
                  whatsappPhone={tenant.whatsapp_phone ?? null}
                  baseUrl={baseUrl}
                  priority={idx < 2}
                />
              </div>
            ))}
          </div>
          <div className="mt-4 flex justify-center sm:hidden">
            <Link
              href={`/sitio/${slug}/productos`}
              className="inline-flex items-center gap-1.5 rounded-xl border px-5 py-2.5 text-sm font-semibold transition-all hover:shadow-sm"
              style={{ borderColor: `${accentColor}40`, color: accentColor }}
            >
              Ver todos los productos <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
        </section>
      )}

      {/* ── Active Promotions ── */}
      {activePromos.length > 0 && (
        <section>
          <div className="mb-6 flex items-end justify-between">
            <div>
              <h2 className="flex items-center gap-2 text-2xl font-extrabold text-gray-900 sm:text-3xl">
                <Tag className="h-6 w-6" style={{ color: accentColor }} />
                Promociones vigentes
              </h2>
              <p className="mt-1 text-sm text-gray-500">Ofertas por tiempo limitado</p>
            </div>
            <Link
              href={`/sitio/${slug}/promociones`}
              className="hidden sm:inline-flex items-center gap-1.5 rounded-xl border px-4 py-2 text-sm font-semibold transition-all hover:shadow-sm"
              style={{ borderColor: `${accentColor}40`, color: accentColor }}
            >
              Ver todas <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {activePromos.slice(0, 3).map((p) => {
              const productIds = [...(p.product_ids ?? []), ...(p.bundle_product_ids ?? [])].filter(Boolean);
              const hasAddable = productIds.length > 0 && ["percentage", "fixed_amount", "bundle_price", "fixed_price"].includes(p.type);
              return (
                <PromotionCard
                  key={p.id}
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
              );
            })}
          </div>
        </section>
      )}

      {/* ── Welcome text ── */}
      {content.welcome_text && (
        <section className="rounded-3xl bg-white p-8 shadow-sm">
          <div
            className="prose prose-sm max-w-none text-gray-700 prose-headings:text-gray-900 prose-a:no-underline"
            style={{ ["--tw-prose-links" as string]: accentColor }}
            dangerouslySetInnerHTML={{ __html: content.welcome_text }}
          />
        </section>
      )}

      {/* ── Feature Cards ── */}
      <section className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
        {cards.slice(0, 4).map((item, i) => {
          const IconComponent =
            item.icon && item.icon in ICON_MAP
              ? ICON_MAP[item.icon as keyof typeof ICON_MAP]
              : ICON_MAP.heart;
          return (
            <div
              key={i}
              className="group rounded-2xl p-6 shadow-sm transition-all hover:-translate-y-1 hover:shadow-md"
              style={{
                backgroundColor: `${accentColor}12`,
                borderLeft: `4px solid ${accentColor}`,
              }}
            >
              <div
                className="flex h-12 w-12 items-center justify-center rounded-xl transition-transform group-hover:scale-110"
                style={{ backgroundColor: `${accentColor}25`, color: accentColor }}
              >
                <IconComponent className="h-6 w-6" />
              </div>
              <h3 className="mt-4 font-bold text-gray-900">{item.title || "Card"}</h3>
              <p className="mt-2 text-sm leading-relaxed text-gray-600">
                {item.description || ""}
              </p>
            </div>
          );
        })}
      </section>

      {/* ── Purchase Steps ── */}
      <section>
        <div className="mb-6">
          <h2 className="text-2xl font-extrabold text-gray-900 sm:text-3xl">
            Proceso de compra sencillo
          </h2>
          <p className="mt-1 text-sm text-gray-500">
            En solo 3 pasos, tu pedido está en camino
          </p>
        </div>
        <div className="grid gap-5 sm:grid-cols-3">
          {purchaseProcess.slice(0, 3).map((step, i) => {
            const icons = [ShoppingCart, MessageCircle, Package];
            const IconEl = icons[i] ?? ShoppingCart;
            return (
              <div
                key={i}
                className="relative overflow-hidden rounded-2xl bg-white p-6 shadow-sm"
              >
                {/* Step number */}
                <div
                  className="absolute right-4 top-4 flex h-7 w-7 items-center justify-center rounded-full text-xs font-extrabold text-white"
                  style={{ backgroundColor: accentColor }}
                >
                  {i + 1}
                </div>
                {/* Decorative circle */}
                <div
                  className="absolute -bottom-6 -right-6 h-24 w-24 rounded-full opacity-10"
                  style={{ backgroundColor: accentColor }}
                />
                <div
                  className="flex h-14 w-14 items-center justify-center rounded-2xl"
                  style={{ backgroundColor: `${accentColor}15`, color: accentColor }}
                >
                  <IconEl className="h-7 w-7" />
                </div>
                <h3 className="mt-4 font-bold text-gray-900">
                  {step.title || `Paso ${i + 1}`}
                </h3>
                <p className="mt-2 text-sm leading-relaxed text-gray-600">
                  {step.description || ""}
                </p>
              </div>
            );
          })}
        </div>
      </section>

      {/* ── Delivery banner ── */}
      {deliveryBannerText && (
        <section
          className="rounded-2xl px-8 py-5"
          style={{ backgroundColor: `${accentColor}15` }}
        >
          <p className="text-center font-semibold text-gray-800">
            {deliveryBannerText}
          </p>
        </section>
      )}

      {/* ── FAQ ── */}
      {faqItems.length > 0 && (
        <section className="rounded-3xl bg-white p-8 shadow-sm">
          <h2 className="mb-6 text-xl font-extrabold text-gray-900">
            Preguntas frecuentes
          </h2>
          <div className="space-y-3">
            {faqItems.map((item, i) => (
              <details
                key={i}
                className="group overflow-hidden rounded-xl border border-gray-100 bg-gray-50 transition-all open:bg-white open:shadow-sm"
              >
                <summary className="flex cursor-pointer items-center justify-between px-5 py-4 font-semibold text-gray-900 marker:content-none">
                  {item.question}
                  <ArrowRight className="h-4 w-4 shrink-0 text-gray-400 transition-transform group-open:rotate-90" />
                </summary>
                <div className="border-t border-gray-100 px-5 py-4 text-sm leading-relaxed text-gray-600">
                  {item.answer}
                </div>
              </details>
            ))}
          </div>
        </section>
      )}
    </div>
  );
}
