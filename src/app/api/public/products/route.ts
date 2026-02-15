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
  const productSlug = searchParams.get("product_slug");
  const subcatalogId = searchParams.get("subcatalog_id");
  const q = searchParams.get("q")?.trim();

  const supabase = createAdminClient();

  let tenantId: string | null = tenantIdParam;
  if (!tenantId && tenantSlug) {
    tenantId = await getTenantIdBySlug(supabase, tenantSlug);
  }
  if (!tenantId) {
    return NextResponse.json(
      { error: "tenant_slug or tenant_id is required" },
      { status: 400 }
    );
  }

  if (productSlug) {
    const { data: product, error } = await supabase
      .from("products")
      .select("id, name, slug, description, price, image_url, subcatalog_id, product_subcatalogs(id, name, slug)")
      .eq("tenant_id", tenantId)
      .eq("slug", productSlug)
      .eq("is_public", true)
      .is("deleted_at", null)
      .single();

    if (error || !product) {
      return NextResponse.json({ error: "Product not found" }, { status: 404 });
    }

    const [imagesRes] = await Promise.all([
      supabase
        .from("product_images")
        .select("url, position")
        .eq("product_id", product.id)
        .order("position", { ascending: true }),
    ]);

    const imageUrls = imagesRes.data?.length
      ? imagesRes.data.map((r) => r.url)
      : product.image_url
        ? [product.image_url]
        : [];

    const { product_subcatalogs: subcatalog, ...rest } = product;
    return NextResponse.json({
      ...rest,
      subcatalog: subcatalog ?? undefined,
      image_urls: imageUrls,
    });
  }

  let query = supabase
    .from("products")
    .select("id, name, slug, description, price, image_url, subcatalog_id")
    .eq("tenant_id", tenantId)
    .eq("is_public", true)
    .is("deleted_at", null)
    .order("created_at", { ascending: false });

  if (subcatalogId) {
    query = query.eq("subcatalog_id", subcatalogId);
  }
  if (q && q.length >= 2) {
    query = query.ilike("name", `%${q}%`).limit(100);
  }

  const { data: products, error } = await query;

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json(products ?? []);
}
