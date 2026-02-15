import { createAdminClient } from "@/lib/supabase/admin";
import { notFound } from "next/navigation";
import { ShoppingCart } from "lucide-react";
import CarritoContent from "./CarritoContent";

interface PageProps {
  params: Promise<{ slug: string }>;
}

export default async function CarritoPage({ params }: PageProps) {
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

  const accentColor = tenant.theme_color?.trim() || "#6366f1";

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <div
          className="flex h-10 w-10 items-center justify-center rounded-xl text-white"
          style={{ backgroundColor: accentColor }}
        >
          <ShoppingCart className="h-5 w-5" />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Carrito</h1>
          <p className="text-sm text-gray-500">
            Revisa tu pedido y finaliza
          </p>
        </div>
      </div>
      <CarritoContent
        tenantId={tenant.id}
        sitioSlug={slug}
        accentColor={accentColor}
      />
    </div>
  );
}
