import { createAdminClient } from "@/lib/supabase/admin";
import { notFound } from "next/navigation";
import { Tag, Gift } from "lucide-react";
import PromotionCard from "./PromotionCard";

export const dynamic = "force-dynamic";

interface PageProps {
  params: Promise<{ slug: string }>;
}

export default async function PromocionesPage({ params }: PageProps) {
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

  const { data: promotions } = await supabase
    .from("promotions")
    .select("id, name, slug, type, value, quantity, min_amount, valid_from, valid_until, image_url, badge_label, product_ids, bundle_product_ids")
    .eq("tenant_id", tenant.id)
    .order("created_at", { ascending: false });

  const now = new Date();
  const active = (promotions ?? []).filter((p) => {
    const from = p.valid_from ? new Date(p.valid_from) : null;
    const until = p.valid_until ? new Date(p.valid_until) : null;
    if (from && from > now) return false;
    if (until && until < now) return false;
    return true;
  });

  const accentColor = tenant.theme_color?.trim() || "#6366f1";

  return (
    <div className="space-y-8">
      <div className="flex items-center gap-3">
        <div
          className="flex h-10 w-10 items-center justify-center rounded-xl text-white"
          style={{ backgroundColor: accentColor }}
        >
          <Tag className="h-5 w-5" />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Promociones</h1>
          <p className="text-sm text-gray-500">
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
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {active.map((p) => {
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
      )}
    </div>
  );
}
