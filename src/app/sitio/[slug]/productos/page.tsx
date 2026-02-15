import { createAdminClient } from "@/lib/supabase/admin";
import { headers } from "next/headers";
import { notFound } from "next/navigation";
import Link from "next/link";
import { Package } from "lucide-react";
import ProductCard from "../ProductCard";

interface PageProps {
  params: Promise<{ slug: string }>;
  searchParams: Promise<{ subcatalog_id?: string }>;
}

export default async function ProductosPage({ params, searchParams }: PageProps) {
  const { slug } = await params;
  const { subcatalog_id } = await searchParams;
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

  const { data: subcatalogs } = await supabase
    .from("product_subcatalogs")
    .select("id, name, slug")
    .eq("tenant_id", tenant.id)
    .order("name", { ascending: true });

  let productsQuery = supabase
    .from("products")
    .select("id, name, slug, description, price, image_url, subcatalog_id")
    .eq("tenant_id", tenant.id)
    .eq("is_public", true)
    .is("deleted_at", null)
    .order("created_at", { ascending: false });

  if (subcatalog_id) {
    productsQuery = productsQuery.eq("subcatalog_id", subcatalog_id);
  }

  const { data: products } = await productsQuery;
  const list = (products ?? []).map((p) => ({
    id: p.id,
    name: p.name,
    slug: p.slug,
    description: p.description,
    price: p.price,
    image_url: p.image_url,
  }));
  const accentColor = tenant.theme_color?.trim() || "#6366f1";

  return (
    <div className="space-y-8">
      {/* Page header */}
      <div className="flex items-center gap-3">
        <div
          className="flex h-10 w-10 items-center justify-center rounded-xl text-white"
          style={{ backgroundColor: accentColor }}
        >
          <Package className="h-5 w-5" />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Productos</h1>
          <p className="text-sm text-gray-500">
            {list.length} producto{list.length !== 1 ? "s" : ""} disponible{list.length !== 1 ? "s" : ""}
          </p>
        </div>
      </div>

      {/* Subcatalog filter */}
      {subcatalogs && subcatalogs.length > 0 && (
        <div className="flex flex-wrap gap-2">
          <Link
            href={`/sitio/${slug}/productos`}
            className={`rounded-lg px-4 py-2 text-sm font-medium transition-colors ${
              !subcatalog_id
                ? "text-white"
                : "bg-gray-200 text-gray-700 hover:bg-gray-300"
            }`}
            style={!subcatalog_id ? { backgroundColor: accentColor } : undefined}
          >
            Todos
          </Link>
          {subcatalogs.map((sc) => (
            <Link
              key={sc.id}
              href={`/sitio/${slug}/productos?subcatalog_id=${sc.id}`}
              className={`rounded-lg px-4 py-2 text-sm font-medium transition-colors ${
                subcatalog_id === sc.id
                  ? "text-white"
                  : "bg-gray-200 text-gray-700 hover:bg-gray-300"
              }`}
              style={subcatalog_id === sc.id ? { backgroundColor: accentColor } : undefined}
            >
              {sc.name}
            </Link>
          ))}
        </div>
      )}

      {list.length === 0 ? (
        <div className="rounded-2xl bg-white py-16 text-center shadow-sm">
          <Package className="mx-auto h-12 w-12 text-gray-300" />
          <p className="mt-4 text-gray-500">
            No hay productos disponibles en este momento.
          </p>
        </div>
      ) : (
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {list.map((item) => (
            <ProductCard
              key={item.id}
              product={item}
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
