import { createAdminClient } from "@/lib/supabase/admin";
import { notFound } from "next/navigation";
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
  const accentColor = tenant.theme_color?.trim() || "#18181b";

  return (
    <div className="space-y-6">
      <h2 className="text-lg font-semibold" style={{ color: accentColor }}>
        Productos
      </h2>

      {list.length === 0 ? (
        <p className="text-sm text-muted-foreground">
          No hay productos públicos en el catálogo.
        </p>
      ) : (
        <ul className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {list.map((item) => (
            <li key={item.id}>
              <ProductCard
                product={item}
                tenantId={tenant.id}
                accentColor={accentColor}
              />
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
