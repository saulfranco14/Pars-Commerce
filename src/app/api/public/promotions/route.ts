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
    .select("id, name, type, value, min_amount, product_ids, valid_from, valid_until")
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

  const allProductIds = active.flatMap((p) => p.product_ids ?? []).filter(Boolean);
  const uniqueIds = [...new Set(allProductIds)];

  const productsMap: Record<string, { id: string; name: string; slug: string | null }> = {};
  if (uniqueIds.length > 0) {
    const { data: products } = await supabase
      .from("products")
      .select("id, name, slug")
      .in("id", uniqueIds)
      .eq("is_public", true)
      .is("deleted_at", null);

    for (const prod of products ?? []) {
      productsMap[prod.id] = { id: prod.id, name: prod.name, slug: prod.slug };
    }
  }

  const promotions = active.map((p) => ({
    id: p.id,
    name: p.name,
    type: p.type,
    value: p.value,
    min_amount: p.min_amount,
    valid_from: p.valid_from,
    valid_until: p.valid_until,
    product_ids: p.product_ids ?? [],
    products: (p.product_ids ?? []).map((id: string) => productsMap[id]).filter(Boolean),
  }));

  return NextResponse.json(promotions);
}
