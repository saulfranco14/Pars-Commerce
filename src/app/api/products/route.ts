import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";

export async function GET(request: Request) {
  const supabase = await createClient();
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const tenantId = searchParams.get("tenant_id");
  const productId = searchParams.get("product_id");
  const type = searchParams.get("type");

  if (!tenantId && !productId) {
    return NextResponse.json(
      { error: "tenant_id or product_id is required" },
      { status: 400 }
    );
  }

  if (productId) {
    const { data: product, error: prodError } = await supabase
      .from("products")
      .select(
        "id, name, slug, sku, description, price, cost_price, commission_amount, unit, type, track_stock, is_public, image_url, created_at, updated_at"
      )
      .eq("id", productId)
      .single();

    if (prodError || !product) {
      return NextResponse.json(
        { error: prodError?.message ?? "Product not found" },
        { status: 404 }
      );
    }

    const [invRes, imagesRes] = await Promise.all([
      supabase
        .from("product_inventory")
        .select("quantity")
        .eq("product_id", product.id)
        .single(),
      supabase
        .from("product_images")
        .select("id, url, position")
        .eq("product_id", product.id)
        .order("position", { ascending: true }),
    ]);

    const imageUrls = imagesRes.data?.length
      ? imagesRes.data.map((r) => r.url)
      : product.image_url
      ? [product.image_url]
      : [];

    return NextResponse.json({
      ...product,
      stock: invRes.data?.quantity ?? 0,
      image_urls: imageUrls,
    });
  }

  const tid = tenantId as string;
  let query = supabase
    .from("products")
    .select(
      "id, name, slug, sku, description, price, cost_price, commission_amount, unit, type, track_stock, is_public, image_url, created_at"
    )
    .eq("tenant_id", tid)
    .order("created_at", { ascending: false });

  if (type === "product" || type === "service") {
    query = query.eq("type", type);
  }

  const { data: products, error } = await query;

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  const list = products ?? [];
  if (list.length === 0) return NextResponse.json([]);

  const ids = list.map((p) => p.id);
  const { data: inventories } = await supabase
    .from("product_inventory")
    .select("product_id, quantity")
    .in("product_id", ids);

  const stockByProduct: Record<string, number> = {};
  for (const inv of inventories ?? []) {
    stockByProduct[inv.product_id] = inv.quantity;
  }

  const withStock = list.map((p) => ({
    ...p,
    stock: stockByProduct[p.id] ?? 0,
  }));

  return NextResponse.json(withStock);
}

export async function POST(request: Request) {
  const supabase = await createClient();
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await request.json();
  const {
    tenant_id,
    name,
    slug,
    sku,
    description,
    price,
    cost_price,
    commission_amount,
    unit,
    type,
    track_stock,
    stock,
    is_public,
    image_url,
    image_urls,
  } = body as {
    tenant_id: string;
    name: string;
    slug: string;
    sku?: string;
    description?: string;
    price: number;
    cost_price: number;
    commission_amount?: number;
    unit?: string;
    type?: string;
    track_stock?: boolean;
    stock?: number;
    is_public?: boolean;
    image_url?: string;
    image_urls?: string[];
  };

  if (!tenant_id || !name || !slug || price == null || cost_price == null) {
    return NextResponse.json(
      { error: "tenant_id, name, slug, price and cost_price are required" },
      { status: 400 }
    );
  }

  const normalizedSlug = slug
    .toLowerCase()
    .trim()
    .replace(/\s+/g, "-")
    .replace(/[^a-z0-9-]/g, "");

  const urls = Array.isArray(image_urls)
    ? image_urls.filter((u) => typeof u === "string" && u.trim())
    : [];
  const firstImage = urls[0] ?? image_url?.trim() ?? null;

  const { data: product, error: productError } = await supabase
    .from("products")
    .insert({
      tenant_id,
      name: name.trim(),
      slug: normalizedSlug,
      sku: sku?.trim() || null,
      description: description?.trim() || null,
      price: Number(price),
      cost_price: Number(cost_price),
      commission_amount:
        commission_amount !== undefined ? Number(commission_amount) : null,
      unit: unit?.trim() || "unit",
      type: type?.trim() || "product",
      track_stock: track_stock ?? true,
      is_public: is_public ?? true,
      image_url: firstImage,
    })
    .select("id, name, slug, price, created_at")
    .single();

  if (productError) {
    if (productError.code === "23505") {
      return NextResponse.json(
        { error: "Slug or SKU already exists for this tenant" },
        { status: 409 }
      );
    }
    return NextResponse.json({ error: productError.message }, { status: 500 });
  }

  const initialQty =
    typeof stock === "number" && stock >= 0 ? Math.floor(stock) : 0;
  const { error: invError } = await supabase.from("product_inventory").insert({
    product_id: product.id,
    quantity: initialQty,
  });

  if (invError) {
    return NextResponse.json(
      { error: "Product created but inventory failed: " + invError.message },
      { status: 500 }
    );
  }

  if (urls.length > 0) {
    const rows = urls.map((url, i) => ({
      product_id: product.id,
      url: url.trim(),
      position: i,
    }));
    await supabase.from("product_images").insert(rows);
  }

  return NextResponse.json(product);
}

export async function PATCH(request: Request) {
  const supabase = await createClient();
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await request.json();
  const {
    product_id,
    name,
    slug,
    sku,
    description,
    price,
    cost_price,
    commission_amount,
    unit,
    type,
    track_stock,
    is_public,
    image_url,
    image_urls,
    stock,
  } = body as {
    product_id: string;
    name?: string;
    slug?: string;
    sku?: string;
    description?: string;
    price?: number;
    cost_price?: number;
    commission_amount?: number;
    unit?: string;
    type?: string;
    track_stock?: boolean;
    is_public?: boolean;
    image_url?: string;
    image_urls?: string[];
    stock?: number;
  };

  if (!product_id) {
    return NextResponse.json(
      { error: "product_id is required" },
      { status: 400 }
    );
  }

  const updates: Record<string, unknown> = {
    updated_at: new Date().toISOString(),
  };
  if (name !== undefined) updates.name = name.trim();
  if (slug !== undefined) {
    updates.slug = slug
      .toLowerCase()
      .trim()
      .replace(/\s+/g, "-")
      .replace(/[^a-z0-9-]/g, "");
  }
  if (sku !== undefined) updates.sku = sku?.trim() || null;
  if (description !== undefined)
    updates.description = description?.trim() || null;
  if (price !== undefined) updates.price = Number(price);
  if (cost_price !== undefined) updates.cost_price = Number(cost_price);
  if (commission_amount !== undefined)
    updates.commission_amount =
      commission_amount !== null ? Number(commission_amount) : null;
  if (unit !== undefined) updates.unit = unit?.trim() || "unit";
  if (type !== undefined) updates.type = type?.trim() || "product";
  if (track_stock !== undefined) updates.track_stock = track_stock;
  if (is_public !== undefined) updates.is_public = is_public;
  if (image_url !== undefined) updates.image_url = image_url?.trim() || null;

  const urls = Array.isArray(image_urls)
    ? image_urls.filter((u) => typeof u === "string" && u.trim())
    : null;
  if (urls) {
    updates.image_url = urls.length > 0 ? urls[0] : null;
  }

  const { data: product, error } = await supabase
    .from("products")
    .update(updates)
    .eq("id", product_id)
    .select("id, name, slug, price, type, image_url, updated_at")
    .single();

  if (error) {
    if (error.code === "23505") {
      return NextResponse.json(
        { error: "Slug or SKU already exists for this tenant" },
        { status: 409 }
      );
    }
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  if (urls) {
    await supabase.from("product_images").delete().eq("product_id", product_id);
    if (urls.length > 0) {
      const rows = urls.map((url, i) => ({
        product_id,
        url: url.trim(),
        position: i,
      }));
      await supabase.from("product_images").insert(rows);
    }
  }

  if (typeof stock === "number" && stock >= 0) {
    const qty = Math.floor(stock);
    const { error: invError } = await supabase
      .from("product_inventory")
      .update({ quantity: qty })
      .eq("product_id", product_id);

    if (invError) {
      return NextResponse.json(
        {
          error:
            "Product updated but inventory update failed: " + invError.message,
        },
        { status: 500 }
      );
    }
  }

  return NextResponse.json(product);
}

export async function DELETE(request: Request) {
  const supabase = await createClient();
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const productId = searchParams.get("product_id");

  if (!productId) {
    return NextResponse.json(
      { error: "product_id is required" },
      { status: 400 }
    );
  }

  const { data: inOrder } = await supabase
    .from("order_items")
    .select("id")
    .eq("product_id", productId)
    .limit(1)
    .single();

  if (inOrder) {
    return NextResponse.json(
      { error: "Product is used in orders and cannot be deleted" },
      { status: 409 }
    );
  }

  const { error: delError } = await supabase
    .from("products")
    .delete()
    .eq("id", productId);

  if (delError) {
    return NextResponse.json({ error: delError.message }, { status: 500 });
  }

  return NextResponse.json({ success: true });
}
