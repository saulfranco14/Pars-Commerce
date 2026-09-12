import { createAdminClient } from "@/lib/supabase/admin";
import { headers } from "next/headers";
import { notFound } from "next/navigation";
import Link from "next/link";
import { Package } from "lucide-react";
import ProductCard from "../ProductCard";
import { enrichProducts } from "@/lib/enrichProducts";
import type { PromotionForPrice } from "@/lib/promotionPrice";
import { DEFAULT_TENANT_ACCENT } from "@/features/sitio-web/constants/templateStyles";

interface PageProps {
  params: Promise<{ slug: string }>;
  searchParams: Promise<{ subcatalog_id?: string; type?: string }>;
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
  const { subcatalog_id, type } = await searchParams;
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
    .eq("slug", slug)
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
        .select("id, name, slug, description, price, image_url, subcatalog_id")
        .eq("tenant_id", tenant.id)
        .eq("is_public", true)
        .is("deleted_at", null)
        .order("created_at", { ascending: false });
      if (subcatalog_id) q = q.eq("subcatalog_id", subcatalog_id);
      if (catalogType) q = q.eq("type", catalogType);
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
    const suffix = query.toString();
    return `/sitio/${slug}/productos${suffix ? `?${suffix}` : ""}`;
  };

  return (
    <div className="space-y-8">
      {/* Page header */}
      <div className="flex items-center gap-4">
        <div
          className="flex h-12 w-12 items-center justify-center rounded-2xl text-white shadow-sm"
          style={{ backgroundColor: accentColor }}
        >
          <Package className="h-6 w-6" />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-gray-900 sm:text-3xl">{pageTitle}</h1>
          <p className="text-sm text-gray-500">{pageDescription}</p>
        </div>
      </div>

      {(productsCount > 0 || servicesCount > 0) && (
        <div>
          <p className="mb-2 text-xs font-semibold uppercase tracking-wider text-gray-500">
            Ver catálogo
          </p>
          <div className="flex flex-wrap gap-2">
            <Link
              href={catalogHref(null)}
              className={`rounded-xl px-5 py-2.5 text-sm font-semibold transition-all ${
                !catalogType ? "text-white shadow-sm" : "bg-gray-100 text-gray-600 hover:bg-gray-200"
              }`}
              style={!catalogType ? { backgroundColor: accentColor } : undefined}
            >
              Todo ({totalCatalogItems})
            </Link>
            {productsCount > 0 && (
              <Link
                href={catalogHref("product")}
                className={`rounded-xl px-5 py-2.5 text-sm font-semibold transition-all ${
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
                className={`rounded-xl px-5 py-2.5 text-sm font-semibold transition-all ${
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

      {/* Subcatalog filter */}
      {subcatalogs && subcatalogs.length > 0 && (
        <div>
          <p className="mb-2 text-xs font-semibold uppercase tracking-wider text-gray-500">
            Categorías
          </p>
          <div className="flex flex-wrap gap-2">
            <Link
              href={catalogHref(catalogType)}
              className={`rounded-xl px-5 py-2.5 text-sm font-semibold transition-all ${
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
                className={`rounded-xl px-5 py-2.5 text-sm font-semibold transition-all ${
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
        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
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
            />
          ))}
        </div>
      )}
    </div>
  );
}
