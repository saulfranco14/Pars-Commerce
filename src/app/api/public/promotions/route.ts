import { createAdminClient } from "@/lib/supabase/admin";
import { NextResponse } from "next/server";

async function getTenantIdBySlug(supabase: ReturnType<typeof createAdminClient>, slug: string): Promise<string | null> {
  const { data } = await supabase
    .from("tenants")
    .select("id")
    .eq("slug", slug)
    .eq("public_store_enabled", true)
    .single();
  return data?.id ?? null;
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const tenantSlug = searchParams.get("tenant_slug");
  const tenantIdParam = searchParams.get("tenant_id");

  if (!tenantSlug && !tenantIdParam) {
    return NextResponse.json(
      { error: "tenant_slug or tenant_id is required" },
      { status: 400 }
    );
  }

  const supabase = createAdminClient();

  let tenantId: string | null = tenantIdParam ?? null;
  if (!tenantId && tenantSlug) {
    tenantId = await getTenantIdBySlug(supabase, tenantSlug);
  }
  if (!tenantId) {
    return NextResponse.json({ error: "Tenant not found" }, { status: 404 });
  }

  const { data: rawPromotions, error } = await supabase
    .from("promotions")
    .select("id, name, slug, type, value, min_amount, product_ids, valid_from, valid_until, image_url, description, badge_label, subcatalog_ids, quantity, bundle_product_ids, trigger_product_ids, trigger_quantity, free_quantity_per_trigger, free_quantity_max")
    .eq("tenant_id", tenantId)
    .order("created_at", { ascending: false });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  const now = new Date();
  const active = (rawPromotions ?? []).filter((p) => {
    const from = p.valid_from ? new Date(p.valid_from) : null;
    const until = p.valid_until ? new Date(p.valid_until) : null;
    if (from && from > now) return false;
    if (until && until < now) return false;
    return true;
  });

  const allProductIds = active.flatMap((p) => {
    const ids = p.product_ids ?? [];
    const bundleIds = p.bundle_product_ids ?? [];
    const triggerIds = p.trigger_product_ids ?? [];
    return [...ids, ...bundleIds, ...triggerIds];
  }).filter(Boolean);
  const uniqueIds = [...new Set(allProductIds)];

  const productsMap: Record<string, { id: string; name: string; slug: string | null; image_url: string | null }> = {};
  if (uniqueIds.length > 0) {
    const { data: products } = await supabase
      .from("products")
      .select("id, name, slug, image_url")
      .in("id", uniqueIds)
      .eq("is_public", true)
      .is("deleted_at", null);

    for (const prod of products ?? []) {
      productsMap[prod.id] = { id: prod.id, name: prod.name, slug: prod.slug, image_url: prod.image_url };
    }
  }

  const promoIds = active.map((p) => p.id);
  const { data: promoImages } = promoIds.length > 0
    ? await supabase
        .from("promotion_images")
        .select("promotion_id, url, position")
        .in("promotion_id", promoIds)
        .order("position", { ascending: true })
    : { data: [] as { promotion_id: string; url: string; position: number }[] };

  const imagesByPromo: Record<string, string[]> = {};
  for (const img of promoImages ?? []) {
    if (!imagesByPromo[img.promotion_id]) imagesByPromo[img.promotion_id] = [];
    imagesByPromo[img.promotion_id].push(img.url);
  }

  const promotions = active.map((p) => {
    const productIds = [
      ...(p.product_ids ?? []),
      ...(p.bundle_product_ids ?? []),
      ...(p.trigger_product_ids ?? []),
    ].filter(Boolean);
    const uniqueProductIds = [...new Set(productIds)];
    return {
      id: p.id,
      name: p.name,
      slug: p.slug,
      type: p.type,
      value: p.value,
      min_amount: p.min_amount,
      valid_from: p.valid_from,
      valid_until: p.valid_until,
      image_url: p.image_url,
      description: p.description,
      badge_label: p.badge_label,
      subcatalog_ids: p.subcatalog_ids ?? [],
      quantity: p.quantity,
      bundle_product_ids: p.bundle_product_ids ?? [],
      product_ids: p.product_ids ?? [],
      trigger_product_ids: p.trigger_product_ids ?? [],
      trigger_quantity: p.trigger_quantity ?? 1,
      free_quantity_per_trigger: p.free_quantity_per_trigger ?? 1,
      free_quantity_max: p.free_quantity_max ?? null,
      image_urls: imagesByPromo[p.id] ?? [],
      products: uniqueProductIds.map((id: string) => productsMap[id]).filter(Boolean),
    };
  });

  return NextResponse.json(promotions);
}
