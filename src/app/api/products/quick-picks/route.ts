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

  // New businesses have no sales history yet. Recent catalogue items are the
  // useful and deterministic fallback until their own quick picks exist.
  const { data, error } = await supabase
    .from("products")
    .select("id, name, slug, sku, price, unit, type, image_url, theme, created_at, subcatalog_id, wholesale_min_quantity, wholesale_price, product_subcatalogs(id, name)")
    .eq("tenant_id", tenantId)
    .is("deleted_at", null)
    .order("created_at", { ascending: false })
    .limit(12);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json((data ?? []).map((product) => {
    const { product_subcatalogs: subcatalog, ...rest } = product;
    return { ...rest, stock: 0, subcatalog: subcatalog ?? undefined };
  }));
}
