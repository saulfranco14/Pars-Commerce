import { NextResponse } from "next/server";

import { createClient } from "@/lib/supabase/server";

/** Small, current catalogue slice for the fast ticket composer. */
export async function GET(request: Request) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const tenantId = new URL(request.url).searchParams.get("tenant_id");
  if (!tenantId) return NextResponse.json({ error: "tenant_id is required" }, { status: 400 });
  const { data: membership } = await supabase
    .from("tenant_memberships")
    .select("tenant_id")
    .eq("tenant_id", tenantId)
    .eq("user_id", user.id)
    .maybeSingle();
  if (!membership) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const since = new Date(Date.now() - 90 * 24 * 60 * 60 * 1000).toISOString();
  const { data: recentLines, error: recentLinesError } = await supabase
    .from("order_items")
    .select("product_id, quantity, orders!inner(tenant_id, created_at, status)")
    .eq("orders.tenant_id", tenantId)
    .gte("orders.created_at", since)
    .neq("orders.status", "cancelled")
    .limit(2_000);
  if (recentLinesError) return NextResponse.json({ error: recentLinesError.message }, { status: 500 });

  const unitsByProduct = new Map<string, number>();
  for (const line of recentLines ?? []) {
    unitsByProduct.set(line.product_id, (unitsByProduct.get(line.product_id) ?? 0) + Number(line.quantity));
  }
  const popularIds = [...unitsByProduct.entries()]
    .sort(([, left], [, right]) => right - left)
    .slice(0, 12)
    .map(([productId]) => productId);

  // New businesses have no sales history. Recent catalogue items remain the
  // deterministic fallback until their own transaction history exists.
  let productsQuery = supabase
    .from("products")
    .select("id, name, slug, sku, price, unit, type, image_url, theme, created_at, subcatalog_id, wholesale_min_quantity, wholesale_price, product_subcatalogs(id, name)")
    .eq("tenant_id", tenantId)
    .is("deleted_at", null);
  if (popularIds.length) productsQuery = productsQuery.in("id", popularIds);
  const { data, error } = await productsQuery
    .order("created_at", { ascending: false })
    .limit(popularIds.length || 12);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  const byId = new Map((data ?? []).map((product) => [product.id, product]));
  const ordered = popularIds.length
    ? popularIds.map((productId) => byId.get(productId)).filter((product): product is NonNullable<typeof product> => Boolean(product))
    : (data ?? []);
  return NextResponse.json(ordered.map((product) => {
    const { product_subcatalogs: subcatalog, ...rest } = product;
    return { ...rest, stock: 0, subcatalog: subcatalog ?? undefined };
  }));
}
