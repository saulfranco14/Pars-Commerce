import { createAdminClient } from "@/lib/supabase/admin";
import { headers } from "next/headers";
import { notFound } from "next/navigation";
import Link from "next/link";
import { Package, Search } from "lucide-react";
import ProductCard from "../ProductCard";
import { enrichProducts } from "@/lib/enrichProducts";
import type { PromotionForPrice } from "@/lib/promotionPrice";
import { DEFAULT_TENANT_ACCENT } from "@/features/sitio-web/constants/templateStyles";

interface PageProps {
  params: Promise<{ slug: string }>;
  searchParams: Promise<{ subcatalog_id?: string; type?: string; q?: string }>;
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

export default async function ProductosPage({
  params,
  searchParams,
}: PageProps) {
  const { slug } = await params;
  const { subcatalog_id, type, q: searchQuery } = await searchParams;
  const catalogType = type === "product" || type === "service" ? type : null;
  const headersList = await headers();
  const host = headersList.get("host") ?? "";
  const protocol =
    headersList.get("x-forwarded-proto") === "https" ? "https" : "http";
  const baseUrl = host ? `${protocol}://${host}` : "";
  const supabase = createAdminClient();

  const { data: tenant, error: tenantError } = await supabase
    .from("tenants")
    .select("id, name, theme_color, whatsapp_phone")
    .eq("site_slug", slug)
    .eq("public_store_enabled", true)
    .single();

  if (tenantError || !tenant) {
    notFound();
  }

  const [
    subcatalogsRes,
    productsRes,
    promosRes,
    productsCountRes,
    servicesCountRes,
  ] = await Promise.all([
    supabase
      .from("product_subcatalogs")
      .select("id, name, slug")
      .eq("tenant_id", tenant.id)
      .order("name", { ascending: true }),
    (() => {
      let q = supabase
        .from("products")
        // Do not let an optional ordering migration make a published catalog empty.
        .select("id, name, slug, description, price, image_url, subcatalog_id, type, has_variants")
        .eq("tenant_id", tenant.id)
        .eq("is_public", true)
        .is("deleted_at", null)
        .order("name", { ascending: true });
      if (subcatalog_id) q = q.eq("subcatalog_id", subcatalog_id);
      if (catalogType) q = q.eq("type", catalogType);
      if (searchQuery?.trim()) q = q.ilike("name", `%${searchQuery.trim().replace(/[,%]/g, "")}%`);
      return q;
    })(),
    supabase
      .from("promotions")
      .select(
        "id, type, value, quantity, product_ids, bundle_product_ids, badge_label, valid_from, valid_until",
      )
      .eq("tenant_id", tenant.id)
      .order("created_at", { ascending: false }),
    supabase
      .from("products")
      .select("id", { count: "exact", head: true })
      .eq("tenant_id", tenant.id)
      .eq("type", "product")
      .eq("is_public", true)
      .is("deleted_at", null),
    supabase
      .from("products")
      .select("id", { count: "exact", head: true })
      .eq("tenant_id", tenant.id)
      .eq("type", "service")
      .eq("is_public", true)
      .is("deleted_at", null),
  ]);

  const subcatalogs = subcatalogsRes.data ?? [];
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
  const activePromos = filterActivePromotions(
    promosRes.data ?? [],
  ) as PromotionForPrice[];
  const list = enrichProducts(
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
    activePromos,
  );
  const accentColor = tenant.theme_color?.trim() || DEFAULT_TENANT_ACCENT;
  const productsCount = productsCountRes.count ?? 0;
  const servicesCount = servicesCountRes.count ?? 0;
  const totalCatalogItems = productsCount + servicesCount;
  const pageTitle =
    catalogType === "product"
      ? "Productos"
      : catalogType === "service"
        ? "Servicios"
        : "Productos y servicios";
  const pageDescription = catalogType
    ? `${list.length} ${catalogType === "product" ? "producto" : "servicio"}${list.length !== 1 ? "s" : ""} disponible${list.length !== 1 ? "s" : ""}`
    : `${productsCount} producto${productsCount !== 1 ? "s" : ""} · ${servicesCount} servicio${servicesCount !== 1 ? "s" : ""} disponible${totalCatalogItems !== 1 ? "s" : ""}`;

  const catalogHref = (
    nextType: "product" | "service" | null,
    nextSubcatalogId?: string,
  ) => {
    const query = new URLSearchParams();
    if (nextType) query.set("type", nextType);
    if (nextSubcatalogId) query.set("subcatalog_id", nextSubcatalogId);
    if (searchQuery?.trim()) query.set("q", searchQuery.trim());
    const suffix = query.toString();
    return `/sitio/${slug}/productos${suffix ? `?${suffix}` : ""}`;
  };

  return (
    <div className="space-y-6 pb-3 sm:space-y-8">
      <div className="flex items-center justify-between gap-4 pt-1 sm:pt-4">
        <div className="flex min-w-0 items-center gap-3">
        <div
          className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl text-white shadow-sm"
          style={{ backgroundColor: accentColor }}
        >
          <Package className="h-5 w-5" />
        </div>
        <div className="min-w-0">
          <h1 className="text-2xl font-bold tracking-tight text-gray-950 sm:text-3xl">{pageTitle}</h1>
          <p className="text-sm text-gray-500">{pageDescription}</p>
        </div>
        </div>
        <Link href={`/sitio/${slug}`} style={{ color: accentColor }} className="hidden min-h-11 items-center text-sm font-semibold hover:underline sm:inline-flex">Inicio</Link>
      </div>

      <div className="sticky top-[65px] z-30 -mx-4 border-y border-gray-200 bg-gray-50/95 px-4 py-3 shadow-sm backdrop-blur-sm sm:top-[73px] sm:mx-0 sm:rounded-2xl sm:border sm:px-3">
      {(productsCount > 0 || servicesCount > 0) && (
        <div className="overflow-x-auto pb-1">
          <div className="flex min-w-max gap-2">
            <Link
              href={catalogHref(null)}
              className={`inline-flex min-h-10 items-center rounded-xl px-4 text-sm font-semibold transition-colors ${
                !catalogType ? "text-white shadow-sm" : "bg-gray-100 text-gray-600 hover:bg-gray-200"
              }`}
              style={!catalogType ? { backgroundColor: accentColor } : undefined}
            >
              Todo ({totalCatalogItems})
            </Link>
            {productsCount > 0 && (
              <Link
                href={catalogHref("product")}
                className={`inline-flex min-h-10 items-center rounded-xl px-4 text-sm font-semibold transition-colors ${
                  catalogType === "product" ? "text-white shadow-sm" : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                }`}
                style={catalogType === "product" ? { backgroundColor: accentColor } : undefined}
              >
                Productos ({productsCount})
              </Link>
            )}
            {servicesCount > 0 && (
              <Link
                href={catalogHref("service")}
                className={`inline-flex min-h-10 items-center rounded-xl px-4 text-sm font-semibold transition-colors ${
                  catalogType === "service" ? "text-white shadow-sm" : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                }`}
                style={catalogType === "service" ? { backgroundColor: accentColor } : undefined}
              >
                Servicios ({servicesCount})
              </Link>
            )}
          </div>
        </div>
      )}

      <form action={`/sitio/${slug}/productos`} className="mt-2 flex min-h-12 items-center gap-2 rounded-xl border border-gray-200 bg-white px-3 shadow-sm focus-within:ring-2" style={{ outlineColor: accentColor }}>
        {catalogType ? <input type="hidden" name="type" value={catalogType} /> : null}
        {subcatalog_id ? <input type="hidden" name="subcatalog_id" value={subcatalog_id} /> : null}
        <Search className="h-5 w-5 text-gray-400" aria-hidden />
        <input name="q" defaultValue={searchQuery ?? ""} placeholder={`Buscar ${catalogType === "service" ? "servicios" : catalogType === "product" ? "productos" : "en la tienda"}`} className="h-12 min-w-0 flex-1 bg-transparent text-sm outline-none" />
        <button type="submit" className="min-h-10 rounded-lg px-3 text-sm font-bold text-white" style={{ backgroundColor: accentColor }}>Buscar</button>
      </form>

      {/* Subcatalog filter */}
      {subcatalogs && subcatalogs.length > 0 && (
        <div className="mt-2 overflow-x-auto pb-1">
          <span className="sr-only">Categorías</span>
          <div className="flex min-w-max gap-2">
            <Link
              href={catalogHref(catalogType)}
              className={`inline-flex min-h-10 items-center rounded-xl px-4 text-sm font-semibold transition-colors ${
                !subcatalog_id
                  ? "text-white shadow-sm"
                  : "bg-gray-100 text-gray-600 hover:bg-gray-200"
              }`}
              style={!subcatalog_id ? { backgroundColor: accentColor } : undefined}
            >
              Todas
            </Link>
            {subcatalogs.map((sc) => (
              <Link
                key={sc.id}
                href={catalogHref(catalogType, sc.id)}
                className={`inline-flex min-h-10 items-center rounded-xl px-4 text-sm font-semibold transition-colors ${
                  subcatalog_id === sc.id
                    ? "text-white shadow-sm"
                    : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                }`}
                style={
                  subcatalog_id === sc.id
                    ? { backgroundColor: accentColor }
                    : undefined
                }
              >
                {sc.name}
              </Link>
            ))}
          </div>
        </div>
      )}
      </div>

      {/* Product grid */}
      {list.length === 0 ? (
        <div className="rounded-3xl bg-white py-20 text-center shadow-sm">
          <div
            className="mx-auto flex h-20 w-20 items-center justify-center rounded-3xl"
            style={{ backgroundColor: `${accentColor}15` }}
          >
            <Package className="h-10 w-10" style={{ color: accentColor }} />
          </div>
          <p className="mt-5 text-base font-medium text-gray-500">
            No hay {catalogType === "service" ? "servicios" : "productos"} disponibles con este filtro.
          </p>
        </div>
      ) : (
        <section aria-label="Resultados del catálogo">
          <div className="mb-4 flex items-baseline justify-between gap-3"><h2 className="text-lg font-bold tracking-tight text-gray-950">{searchQuery?.trim() ? "Resultados" : catalogType === "service" ? "Servicios disponibles" : catalogType === "product" ? "Productos disponibles" : "Disponible ahora"}</h2><p className="shrink-0 text-sm text-gray-500">{list.length} {list.length === 1 ? "resultado" : "resultados"}</p></div>
        <div className="grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-4">
          {list.map((item) => (
            <ProductCard
              key={item.id}
              product={item}
              promotion={item.promotion}
              tenantId={tenant.id}
              sitioSlug={slug}
              accentColor={accentColor}
              whatsappPhone={tenant.whatsapp_phone ?? null}
              baseUrl={baseUrl}
              compact
            />
          ))}
        </div>
        </section>
      )}
    </div>
  );
}
