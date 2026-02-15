import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";

const FINGERPRINT_HEADER = "x-fingerprint-id";

function getFingerprint(request: Request): string | null {
  return request.headers.get(FINGERPRINT_HEADER)?.trim() || null;
}

export async function GET(request: Request) {
  const supabase = await createClient();
  const { searchParams } = new URL(request.url);
  const tenantId = searchParams.get("tenant_id");
  const fingerprint = getFingerprint(request);

  if (!tenantId || !fingerprint) {
    return NextResponse.json(
      { error: "tenant_id and x-fingerprint-id header are required" },
      { status: 400 }
    );
  }

  const { data: cart, error: cartError } = await supabase
    .from("public_carts")
    .select("id, tenant_id, created_at")
    .eq("tenant_id", tenantId)
    .eq("fingerprint_id", fingerprint)
    .single();

  if (cartError && cartError.code !== "PGRST116") {
    return NextResponse.json({ error: cartError.message }, { status: 500 });
  }

  if (!cart) {
    return NextResponse.json({ cart: null, items: [] });
  }

  const { data: items, error: itemsError } = await supabase
    .from("public_cart_items")
    .select(`
      id,
      product_id,
      quantity,
      price_snapshot,
      promotion_id,
      product:products(id, name, slug, image_url)
    `)
    .eq("cart_id", cart.id)
    .order("added_at", { ascending: true });

  if (itemsError) {
    return NextResponse.json({ error: itemsError.message }, { status: 500 });
  }

  const subtotal = (items ?? []).reduce(
    (sum, i) => sum + Number(i.price_snapshot) * i.quantity,
    0
  );
  const itemsCount = (items ?? []).reduce((sum, i) => sum + i.quantity, 0);

  return NextResponse.json({
    cart: { id: cart.id, tenant_id: cart.tenant_id },
    items: items ?? [],
    subtotal,
    items_count: itemsCount,
  });
}

export async function POST(request: Request) {
  const supabase = await createClient();
  const fingerprint = getFingerprint(request);

  if (!fingerprint) {
    return NextResponse.json(
      { error: "x-fingerprint-id header is required" },
      { status: 400 }
    );
  }

  let body: { tenant_id?: string; product_id?: string; promotion_id?: string; quantity?: number };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const { tenant_id, product_id, promotion_id, quantity = 1 } = body;

  if (!tenant_id) {
    return NextResponse.json(
      { error: "tenant_id is required" },
      { status: 400 }
    );
  }

  const { data: tenant } = await supabase
    .from("tenants")
    .select("id")
    .eq("id", tenant_id)
    .eq("public_store_enabled", true)
    .single();

  if (!tenant) {
    return NextResponse.json(
      { error: "Tenant not found or public store disabled" },
      { status: 404 }
    );
  }

  const { data: existingCart } = await supabase
    .from("public_carts")
    .select("id")
    .eq("tenant_id", tenant_id)
    .eq("fingerprint_id", fingerprint)
    .single();

  let cartId: string;

  if (existingCart) {
    cartId = existingCart.id;
  } else {
    const { data: newCart, error: insertError } = await supabase
      .from("public_carts")
      .insert({
        tenant_id,
        fingerprint_id: fingerprint,
      })
      .select("id")
      .single();

    if (insertError) {
      return NextResponse.json({ error: insertError.message }, { status: 500 });
    }
    cartId = newCart!.id;
  }

  if (promotion_id) {
    return handleAddPromotion(supabase, tenant_id, promotion_id, cartId, fingerprint);
  }

  if (!product_id || quantity < 1) {
    return NextResponse.json(
      { error: "product_id and quantity (>= 1) are required when not adding promotion" },
      { status: 400 }
    );
  }

  const { data: product, error: productError } = await supabase
    .from("products")
    .select("id, price")
    .eq("id", product_id)
    .eq("tenant_id", tenant_id)
    .eq("is_public", true)
    .single();

  if (productError || !product) {
    return NextResponse.json(
      { error: "Product not found or not public" },
      { status: 404 }
    );
  }

  const price = Number(product.price);

  const { error: upsertError } = await supabase
    .from("public_cart_items")
    .upsert(
      {
        cart_id: cartId,
        product_id: product_id,
        quantity,
        price_snapshot: price,
      },
      {
        onConflict: "cart_id,product_id",
        ignoreDuplicates: false,
      }
    );

  if (upsertError) {
    return NextResponse.json({ error: upsertError.message }, { status: 500 });
  }

  return NextResponse.json({ success: true, cart_id: cartId });
}

type SupabaseClient = Awaited<ReturnType<typeof createClient>>;

async function handleAddPromotion(
  supabase: SupabaseClient,
  tenantId: string,
  promotionId: string,
  cartId: string,
  _fingerprint: string
): Promise<NextResponse> {
  const { data: promotion, error: promoError } = await supabase
    .from("promotions")
    .select("id, type, value, quantity, product_ids, bundle_product_ids")
    .eq("id", promotionId)
    .eq("tenant_id", tenantId)
    .single();

  if (promoError || !promotion) {
    return NextResponse.json(
      { error: "Promotion not found" },
      { status: 404 }
    );
  }

  const productIds = [
    ...(promotion.product_ids ?? []),
    ...(promotion.bundle_product_ids ?? []),
  ].filter(Boolean) as string[];
  const uniqueIds = [...new Set(productIds)];

  if (uniqueIds.length === 0) {
    return NextResponse.json(
      { error: "Promotion has no products" },
      { status: 400 }
    );
  }

  const { data: products } = await supabase
    .from("products")
    .select("id, price")
    .in("id", uniqueIds)
    .eq("tenant_id", tenantId)
    .eq("is_public", true);

  const productsMap = new Map(
    (products ?? []).map((p: { id: string; price: number }) => [p.id, Number(p.price)])
  );
  const promoValue = Number(promotion.value);
  const promoQty = Number(promotion.quantity ?? 1);

  const isBundle = promotion.type === "bundle_price";
  const bundleTotalUnits = isBundle && uniqueIds.length === 1 ? promoQty : uniqueIds.length;

  for (const pid of uniqueIds) {
    const basePrice: number = productsMap.get(pid) ?? 0;
    let finalPrice: number;

    switch (promotion.type) {
      case "percentage":
        finalPrice = basePrice * (1 - promoValue / 100);
        break;
      case "fixed_amount":
        finalPrice = Math.max(0, basePrice - promoValue);
        break;
      case "bundle_price":
        finalPrice = promoValue / bundleTotalUnits;
        break;
      case "fixed_price":
        finalPrice = promoValue;
        break;
      default:
        finalPrice = basePrice;
    }

    const qty = isBundle ? (uniqueIds.length === 1 ? promoQty : 1) : 1;
    const { error: upsertErr } = await supabase
      .from("public_cart_items")
      .upsert(
        {
          cart_id: cartId,
          product_id: pid,
          quantity: qty,
          price_snapshot: Math.round(finalPrice * 100) / 100,
          promotion_id: promotionId,
        },
        { onConflict: "cart_id,product_id", ignoreDuplicates: false }
      );

    if (upsertErr) {
      return NextResponse.json({ error: upsertErr.message }, { status: 500 });
    }
  }

  return NextResponse.json({ success: true, cart_id: cartId });
}

export async function PATCH(request: Request) {
  const supabase = await createClient();
  const fingerprint = getFingerprint(request);

  if (!fingerprint) {
    return NextResponse.json(
      { error: "x-fingerprint-id header is required" },
      { status: 400 }
    );
  }

  let body: { cart_id?: string; product_id?: string; quantity?: number };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const { cart_id, product_id, quantity } = body;

  if (!cart_id || !product_id) {
    return NextResponse.json(
      { error: "cart_id and product_id are required" },
      { status: 400 }
    );
  }

  const { data: cart } = await supabase
    .from("public_carts")
    .select("id")
    .eq("id", cart_id)
    .eq("fingerprint_id", fingerprint)
    .single();

  if (!cart) {
    return NextResponse.json({ error: "Cart not found" }, { status: 404 });
  }

  if (quantity !== undefined) {
    if (quantity < 1) {
      const { error: delError } = await supabase
        .from("public_cart_items")
        .delete()
        .eq("cart_id", cart_id)
        .eq("product_id", product_id);

      if (delError) {
        return NextResponse.json({ error: delError.message }, { status: 500 });
      }
    } else {
      const { error: updateError } = await supabase
        .from("public_cart_items")
        .update({ quantity })
        .eq("cart_id", cart_id)
        .eq("product_id", product_id);

      if (updateError) {
        return NextResponse.json({ error: updateError.message }, { status: 500 });
      }
    }
  }

  return NextResponse.json({ success: true });
}

export async function DELETE(request: Request) {
  const supabase = await createClient();
  const fingerprint = getFingerprint(request);
  const { searchParams } = new URL(request.url);
  const cartId = searchParams.get("cart_id");
  const productId = searchParams.get("product_id");

  if (!fingerprint || !cartId || !productId) {
    return NextResponse.json(
      { error: "x-fingerprint-id header, cart_id and product_id are required" },
      { status: 400 }
    );
  }

  const { data: cart } = await supabase
    .from("public_carts")
    .select("id")
    .eq("id", cartId)
    .eq("fingerprint_id", fingerprint)
    .single();

  if (!cart) {
    return NextResponse.json({ error: "Cart not found" }, { status: 404 });
  }

  const { error } = await supabase
    .from("public_cart_items")
    .delete()
    .eq("cart_id", cartId)
    .eq("product_id", productId);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ success: true });
}
