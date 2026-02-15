import { createAdminClient } from "@/lib/supabase/admin";
import { notFound } from "next/navigation";
import { Package } from "lucide-react";
import ProductCard from "../ProductCard";

interface PageProps {
  params: Promise<{ slug: string }>;
}

export default async function ProductosPage({ params }: PageProps) {
  const { slug } = await params;
  const supabase = createAdminClient();

  const { data: tenant, error: tenantError } = await supabase
    .from("tenants")
    .select("id, name, theme_color")
    .eq("slug", slug)
    .single();

  if (tenantError || !tenant) {
    notFound();
  }

  const { data: products } = await supabase
    .from("products")
    .select("id, name, slug, description, price, image_url")
    .eq("tenant_id", tenant.id)
    .eq("is_public", true)
    .order("created_at", { ascending: false });

  const list = products ?? [];
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
              accentColor={accentColor}
            />
          ))}
        </div>
      )}
    </div>
  );
}
