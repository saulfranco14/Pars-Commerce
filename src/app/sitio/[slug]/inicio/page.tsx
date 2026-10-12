import { createAdminClient } from "@/lib/supabase/admin";
import { headers } from "next/headers";
import { notFound } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import {
  ArrowRight,
  ShoppingBag,
  ShoppingCart,
  MessageCircle,
  Package,
  Tag,
  Clock3,
  ShieldCheck,
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
import { DEFAULT_TENANT_ACCENT } from "@/features/sitio-web/constants/templateStyles";

interface PageProps {
  params: Promise<{ slug: string }>;
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

export default async function InicioPage({ params }: PageProps) {
  const { slug } = await params;
  const headersList = await headers();
  const host = headersList.get("host") ?? "";
  const protocol =
    headersList.get("x-forwarded-proto") === "https" ? "https" : "http";
  const baseUrl = host ? `${protocol}://${host}` : "";
  const supabase = createAdminClient();

  const { data: tenant, error: tenantError } = await supabase
    .from("tenants")
    .select("id, name, description, theme_color, whatsapp_phone")
    .eq("site_slug", slug)
    .eq("public_store_enabled", true)
    .single();

  if (tenantError || !tenant) {
    notFound();
  }

  const [pageRes, productsRes, servicesRes, promosRes] = await Promise.all([
    supabase
      .from("tenant_site_pages")
      .select("content")
      .eq("tenant_id", tenant.id)
      .eq("slug", "inicio")
      .eq("is_enabled", true)
      .single(),
    supabase
      .from("products")
      // Keep the public store compatible while a database migration is rolling out.
      // A missing presentation-only order column must never hide a merchant's catalog.
      .select("id, name, slug, description, price, image_url, subcatalog_id, type, has_variants")
      .eq("tenant_id", tenant.id)
      .eq("type", "product")
      .eq("is_public", true)
      .is("deleted_at", null)
      .order("name", { ascending: true })
      .limit(6),
    supabase
      .from("products")
      .select("id, name, slug, description, price, image_url, subcatalog_id, type, has_variants")
      .eq("tenant_id", tenant.id)
      .eq("type", "service")
      .eq("is_public", true)
      .is("deleted_at", null)
      .order("name", { ascending: true })
      .limit(6),
    supabase
      .from("promotions")
      .select(
        "id, name, slug, type, value, quantity, min_amount, product_ids, bundle_product_ids, badge_label, valid_from, valid_until, image_url",
      )
      .eq("tenant_id", tenant.id)
      .order("created_at", { ascending: false }),
  ]);

  const products = [...(productsRes.data ?? []), ...(servicesRes.data ?? [])];
  const productIds = products.map((p) => p.id);
  const { data: imagesData } =
    productIds.length > 0
      ? await supabase
          .from("product_images")
          .select("product_id, url, position")
          .in("product_id", productIds)
      : { data: [] };
  const images = imagesData ?? [];
  const activePromos = filterActivePromotions(
    promosRes.data ?? [],
  ) as NonNullable<typeof promosRes.data>;
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
      type: p.type,
    })),
    images,
    promosForPrice,
  );
  const featuredProductItems = featuredProducts.filter((item) => item.type !== "service").slice(0, 6);
  const featuredServiceItems = featuredProducts.filter((item) => item.type === "service").slice(0, 6);

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
  const accentColor = tenant.theme_color?.trim() || DEFAULT_TENANT_ACCENT;

  return (
    <div className="space-y-9 pb-3 sm:space-y-12">
      {/* Portada editorial: la tienda empieza por lo que se puede comprar. */}
      <section className="grid gap-5 px-1 pt-2 sm:grid-cols-[1.15fr_.85fr] sm:items-end sm:pt-5">
        <div>
          <p className="text-sm font-semibold" style={{ color: accentColor }}>TIENDA {tenant.name.toUpperCase()}</p>
          <h1 className="mt-2 max-w-2xl text-4xl font-bold leading-[1.04] tracking-[-0.045em] text-gray-950 sm:text-5xl lg:text-6xl">Encuentra lo que necesitas.</h1>
        </div>
        <div className="max-w-md sm:justify-self-end">
          <p className="text-lg font-semibold leading-7 text-gray-800">Compra productos, elige servicios y sigue tu pedido desde un solo lugar.</p>
          <div className="mt-4 flex flex-wrap gap-x-4 gap-y-2 text-sm font-semibold">
            <Link href={`/sitio/${slug}/productos`} style={{ color: accentColor }} className="inline-flex min-h-11 items-center gap-1 hover:underline">Explorar catálogo <ArrowRight className="h-4 w-4" /></Link>
            {activePromos.length > 0 ? <Link href={`/sitio/${slug}/promociones`} style={{ color: accentColor }} className="inline-flex min-h-11 items-center gap-1 hover:underline">Ver promociones <ArrowRight className="h-4 w-4" /></Link> : null}
          </div>
        </div>
      </section>

      <nav aria-label="Explorar el catálogo" className="-mx-4 overflow-x-auto px-5 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden sm:mx-0 sm:px-0">
        <div className="flex min-w-max gap-5 px-1 py-1 sm:min-w-0 sm:justify-start sm:gap-8">
          {[
            ...(featuredProductItems.length > 0 ? [{ href: `/sitio/${slug}/productos?type=product`, label: "Productos", image: featuredProductItems[0]?.image_urls?.[0] }] : []),
            ...(featuredServiceItems.length > 0 ? [{ href: `/sitio/${slug}/productos?type=service`, label: "Servicios", image: featuredServiceItems[0]?.image_urls?.[0] }] : []),
            ...(activePromos.length > 0 ? [{ href: `/sitio/${slug}/promociones`, label: "Promociones", image: activePromos[0]?.image_url }] : []),
          ].map((entry) => (
            <Link key={entry.label} href={entry.href} className="group flex w-[76px] flex-col items-center gap-2 text-center text-xs font-semibold text-gray-800 sm:w-24 sm:text-sm">
              <span className="relative flex h-16 w-16 items-center justify-center overflow-hidden rounded-full bg-white shadow-sm ring-1 ring-gray-200 transition-transform duration-200 group-hover:scale-105 sm:h-20 sm:w-20">
                {entry.image ? <Image src={entry.image} alt="" fill sizes="80px" className="object-cover" /> : <ShoppingBag className="h-7 w-7" style={{ color: accentColor }} />}
              </span>
              {entry.label}
            </Link>
          ))}
        </div>
      </nav>

      {/* ── Featured Products ── */}
      {featuredProductItems.length > 0 && (
        <section>
          <div className="mb-6 flex items-end justify-between">
            <div>
              <h2 className="text-2xl font-bold text-gray-900 sm:text-3xl">
                Lo más nuevo
              </h2>
              <p className="mt-1 text-sm text-gray-500">
                Productos para descubrir y agregar a tu pedido
              </p>
            </div>
            <Link
              href={`/sitio/${slug}/productos`}
              className="hidden sm:inline-flex items-center gap-1.5 rounded-xl border px-4 py-2 text-sm font-semibold transition-all hover:shadow-sm"
              style={{ borderColor: `${accentColor}40`, color: accentColor }}
            >
              Ver todos <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
          <div className="-mx-4 flex snap-x snap-mandatory gap-4 overflow-x-auto overscroll-x-contain scroll-smooth scroll-px-5 px-5 pb-4 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden sm:-mx-6 sm:scroll-px-6 sm:px-6">
            {featuredProductItems.map((item, idx) => (
              <div
                key={item.id}
                className="w-[78vw] max-w-[280px] shrink-0 snap-start"
              >
                <ProductCard
                  product={item}
                  promotion={item.promotion}
                  tenantId={tenant.id}
                  sitioSlug={slug}
                  accentColor={accentColor}
                  whatsappPhone={tenant.whatsapp_phone ?? null}
                  baseUrl={baseUrl}
                  priority={idx < 2}
                  compact
                />
              </div>
            ))}
            <div aria-hidden className="w-1 shrink-0 sm:w-2" />
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

      {featuredServiceItems.length > 0 && (
        <section>
          <div className="mb-6 flex items-end justify-between">
            <div><h2 className="text-2xl font-bold text-gray-900 sm:text-3xl">Servicios para ti</h2><p className="mt-1 text-sm text-gray-500">Elige, agenda o solicita atención desde el mismo sitio</p></div>
            <Link href={`/sitio/${slug}/productos?type=service`} className="hidden items-center gap-1.5 rounded-xl border px-4 py-2 text-sm font-semibold sm:inline-flex" style={{ borderColor: `${accentColor}40`, color: accentColor }}>Ver todos <ArrowRight className="h-4 w-4" /></Link>
          </div>
          <div className="-mx-4 flex snap-x snap-mandatory gap-4 overflow-x-auto overscroll-x-contain scroll-smooth scroll-px-5 px-5 pb-4 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden sm:-mx-6 sm:scroll-px-6 sm:px-6">
            {featuredServiceItems.map((item) => <div key={item.id} className="w-[78vw] max-w-[280px] shrink-0 snap-start"><ProductCard product={item} promotion={item.promotion} tenantId={tenant.id} sitioSlug={slug} accentColor={accentColor} whatsappPhone={tenant.whatsapp_phone ?? null} baseUrl={baseUrl} compact /></div>)}
            <div aria-hidden className="w-1 shrink-0 sm:w-2" />
          </div>
        </section>
      )}

      <section className="grid grid-cols-3 overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm">
        {[{ icon: ShieldCheck, title: "Compra clara", text: "Precios visibles" }, { icon: Clock3, title: "A tu tiempo", text: "Entrega o recolección" }, { icon: MessageCircle, title: "Atención directa", text: "Seguimiento del negocio" }].map(({ icon: Icon, title, text }) => (
          <div key={title} className="flex min-w-0 flex-col items-center gap-1 border-r border-gray-100 px-2 py-4 text-center last:border-r-0 sm:flex-row sm:justify-center sm:gap-3 sm:px-4">
            <Icon className="h-5 w-5 shrink-0" style={{ color: accentColor }} />
            <div className="min-w-0 sm:text-left"><p className="truncate text-xs font-bold text-gray-900 sm:text-sm">{title}</p><p className="hidden text-xs text-gray-500 sm:block">{text}</p></div>
          </div>
        ))}
      </section>

      {content.hero_image_url ? (
        <section className="relative isolate min-h-52 overflow-hidden rounded-3xl bg-gray-950 px-6 py-7 text-white shadow-sm sm:min-h-64 sm:px-10 sm:py-9">
          <Image src={content.hero_image_url} alt={content.title || tenant.name} fill sizes="(max-width: 1024px) 100vw, 1200px" className="-z-10 object-cover opacity-55" quality={80} />
          <div className="absolute inset-0 -z-10 bg-gradient-to-r from-black/80 via-black/45 to-black/10" />
          <div className="max-w-xl"><p className="text-xs font-bold uppercase tracking-[0.14em] text-white/70">Destacado de {tenant.name}</p><h2 className="mt-2 text-3xl font-bold tracking-tight sm:text-4xl">{content.title || tenant.name}</h2>{content.subtitle || tenant.description ? <p className="mt-3 max-w-lg text-sm leading-6 text-white/85 sm:text-base">{content.subtitle || tenant.description}</p> : null}<Link href={`/sitio/${slug}/productos`} className="mt-5 inline-flex min-h-11 items-center gap-2 rounded-xl bg-white px-4 text-sm font-bold text-gray-950 transition-colors hover:bg-gray-100">Ver disponibles <ArrowRight className="h-4 w-4" /></Link></div>
        </section>
      ) : null}

      {/* ── Active Promotions ── */}
      {activePromos.length > 0 && (
        <section>
          <div className="mb-6 flex items-end justify-between">
            <div>
              <h2 className="flex items-center gap-2 text-2xl font-bold text-gray-900 sm:text-3xl">
                <Tag className="h-6 w-6" style={{ color: accentColor }} />
                Promociones vigentes
              </h2>
              <p className="mt-1 text-sm text-gray-500">
                Ofertas por tiempo limitado
              </p>
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
              const productIds = [
                ...(p.product_ids ?? []),
                ...(p.bundle_product_ids ?? []),
              ].filter(Boolean);
              const hasAddable =
                productIds.length > 0 &&
                [
                  "percentage",
                  "fixed_amount",
                  "bundle_price",
                  "fixed_price",
                ].includes(p.type);
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
                style={{
                  backgroundColor: `${accentColor}25`,
                  color: accentColor,
                }}
              >
                <IconComponent className="h-6 w-6" />
              </div>
              <h3 className="mt-4 font-bold text-gray-900">
                {item.title || "Card"}
              </h3>
              <p className="mt-2 text-sm leading-relaxed text-gray-600">
                {item.description || ""}
              </p>
            </div>
          );
        })}
      </section>

      {/* ── Purchase Steps ── */}
      <section className="grid gap-5 lg:grid-cols-[1.05fr_.95fr] lg:items-stretch">
        <div className="relative min-h-80 overflow-hidden rounded-3xl bg-gray-950 p-6 text-white sm:p-8">
          {content.hero_image_url ? (
            <Image src={content.hero_image_url} alt="" fill sizes="(max-width: 1024px) 100vw, 55vw" className="object-cover opacity-30" />
          ) : null}
          <div className="absolute inset-0 bg-gradient-to-br from-black/20 to-black/80" />
          <div className="relative flex h-full max-w-md flex-col justify-between">
            <div>
              <p className="text-xs font-bold uppercase tracking-[0.14em] text-white/60">Del carrito a la entrega</p>
              <h2 className="mt-3 text-3xl font-bold tracking-tight">Sabes qué pasa después de hacer tu pedido.</h2>
              <p className="mt-3 text-sm leading-6 text-white/70">Tu compra no desaparece en un chat: el negocio recibe la orden, confirma el cobro y actualiza su avance.</p>
            </div>
            <div className="mt-8 rounded-2xl bg-white/10 p-4 backdrop-blur">
              <div className="flex items-center justify-between text-sm"><span>Estado del pedido</span><span className="rounded-full bg-emerald-400/20 px-2.5 py-1 text-xs font-bold text-emerald-200">Recibido</span></div>
              <div className="mt-4 h-1.5 overflow-hidden rounded-full bg-white/15"><div className="h-full w-1/3 rounded-full" style={{ backgroundColor: accentColor }} /></div>
              <p className="mt-3 text-xs text-white/60">Siguiente: confirmación del negocio</p>
            </div>
          </div>
        </div>
        <div className="grid gap-3">
          {purchaseProcess.slice(0, 3).map((step, i) => {
            const icons = [ShoppingCart, MessageCircle, Package];
            const IconEl = icons[i] ?? ShoppingCart;
            return (
              <div key={i} className="flex items-start gap-4 rounded-2xl border border-gray-200 bg-white p-5 shadow-sm">
                <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl" style={{ backgroundColor: `${accentColor}15`, color: accentColor }}><IconEl className="h-6 w-6" /></div>
                <div><p className="text-xs font-bold" style={{ color: accentColor }}>PASO {i + 1}</p><h3 className="mt-1 font-bold text-gray-900">{step.title || `Paso ${i + 1}`}</h3><p className="mt-1 text-sm leading-6 text-gray-600">{step.description || ""}</p></div>
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
          <h2 className="mb-6 text-xl font-bold text-gray-900">
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
