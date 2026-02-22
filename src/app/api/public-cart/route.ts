import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";
import { recalculateCart } from "@/lib/cartRecalculation";

const FINGERPRINT_HEADER = "x-fingerprint-id";

function getFingerprint(request: Request): string | null {
  return request.headers.get(FINGERPRINT_HEADER)?.trim() || null;
}

type SupabaseClient = Awaited<ReturnType<typeof createClient>>;

async function recalcAndPersist(
  supabase: Awaited<ReturnType<typeof createClient>>,
  tenantId: string,
  cartId: string
): Promise<{ items: unknown[]; subtotal: number; itemsCount: number }> {
  const { data: rawItems } = await supabase
    .from("public_cart_items")
    .select("id, product_id, quantity, price_snapshot, promotion_id, quantity_free")
    .eq("cart_id", cartId)
    .order("added_at", { ascending: true });

  const items = rawItems ?? [];
  if (items.length === 0) {
    return { items: [], subtotal: 0, itemsCount: 0 };
  }

  const now = new Date();
  const { data: promos } = await supabase
    .from("promotions")
    .select(
      "id, name, type, value, quantity, product_ids, bundle_product_ids, valid_from, valid_until, " +
        "apply_automatically, priority, trigger_product_ids, trigger_quantity, " +
        "free_quantity_per_trigger, free_quantity_max"
    )
    .eq("tenant_id", tenantId);

  type PromoRow = {
    id: string;
    name: string;
    type: string;
    value: number;
    quantity?: number | null;
    product_ids?: string[] | null;
    bundle_product_ids?: string[] | null;
    valid_from?: string | null;
    valid_until?: string | null;
    apply_automatically?: boolean;
    priority?: number;
    trigger_product_ids?: string[] | null;
    trigger_quantity?: number;
    free_quantity_per_trigger?: number;
    free_quantity_max?: number | null;
  };

  const rawPromoList = (promos ?? []) as unknown[];
  const activePromos = rawPromoList.filter((p: unknown) => {
    const row = p as PromoRow;
    const from = row.valid_from ? new Date(row.valid_from) : null;
    const until = row.valid_until ? new Date(row.valid_until) : null;
    if (from && from > now) return false;
    if (until && until < now) return false;
    return true;
  }) as PromoRow[];

  const productIds = [...new Set(items.map((i) => i.product_id))];
  const { data: products } = await supabase
    .from("products")
    .select("id, price")
    .in("id", productIds);

  const productsMap = new Map(
    (products ?? []).map((p: { id: string; price: number }) => [p.id, Number(p.price)])
  );

  const normalizedItems = items.map((i) => ({
    id: i.id,
    product_id: i.product_id,
    quantity: i.quantity,
    price_snapshot: i.price_snapshot,
    promotion_id: i.promotion_id,
    quantity_free: i.quantity_free ?? 0,
  }));

  const normalizedPromos = activePromos.map((p) => ({
    id: p.id,
    name: p.name ?? "",
    type: p.type,
    value: Number(p.value),
    quantity: p.quantity ?? null,
    product_ids: p.product_ids ?? null,
    bundle_product_ids: p.bundle_product_ids ?? null,
    apply_automatically: p.apply_automatically ?? false,
    priority: p.priority ?? 100,
    trigger_product_ids: p.trigger_product_ids ?? null,
    trigger_quantity: p.trigger_quantity ?? 1,
    free_quantity_per_trigger: p.free_quantity_per_trigger ?? 1,
    free_quantity_max: p.free_quantity_max ?? null,
  }));

  const recalculated = recalculateCart(
    normalizedItems,
    normalizedPromos,
    productsMap
  );

  for (const r of recalculated) {
    await supabase
      .from("public_cart_items")
      .update({
        price_snapshot: r.price_snapshot,
        promotion_id: r.promotion_id,
        quantity_free: r.quantity_free,
      })
      .eq("id", r.id);
  }

  let subtotal = 0;
  for (const r of recalculated) {
    const paidQty = r.quantity - r.quantity_free;
    subtotal += paidQty * r.price_snapshot;
  }
  const itemsCount = recalculated.reduce((s, i) => s + i.quantity, 0);

  const { data: itemsWithProduct } = await supabase
    .from("public_cart_items")
    .select(
      "id, product_id, quantity, price_snapshot, promotion_id, quantity_free, " +
        "product:products(id, name, slug, image_url), " +
        "promotion:promotions(name)"
    )
    .eq("cart_id", cartId)
    .order("added_at", { ascending: true });

  return {
    items: itemsWithProduct ?? [],
    subtotal: Math.round(subtotal * 100) / 100,
    itemsCount,
  };
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
    return NextResponse.json({ cart: null, items: [], subtotal: 0, items_count: 0 });
  }

  const { items, subtotal, itemsCount } = await recalcAndPersist(
    supabase,
    tenantId,
    cart.id
  );

  return NextResponse.json({
    cart: { id: cart.id, tenant_id: cart.tenant_id },
    items,
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
    return handleAddPromotion(supabase, tenant_id, promotion_id, cartId);
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

  const { data: existingItem } = await supabase
    .from("public_cart_items")
    .select("quantity")
    .eq("cart_id", cartId)
    .eq("product_id", product_id)
    .single();

  const newQty = existingItem
    ? (existingItem.quantity as number) + quantity
    : quantity;

  const { error: upsertError } = await supabase
    .from("public_cart_items")
    .upsert(
      {
        cart_id: cartId,
        product_id: product_id,
        quantity: newQty,
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

  await recalcAndPersist(supabase, tenant_id, cartId);
  return NextResponse.json({ success: true, cart_id: cartId });
}

async function handleAddPromotion(
  supabase: Awaited<ReturnType<typeof createClient>>,
  tenantId: string,
  promotionId: string,
  cartId: string
): Promise<NextResponse> {
  const { data: promotion, error: promoError } = await supabase
    .from("promotions")
    .select(
      "id, type, value, quantity, product_ids, bundle_product_ids, " +
        "trigger_product_ids, trigger_quantity, free_quantity_per_trigger"
    )
    .eq("id", promotionId)
    .eq("tenant_id", tenantId)
    .single();

  if (promoError || !promotion) {
    return NextResponse.json(
      { error: "Promotion not found" },
      { status: 404 }
    );
  }

  type PromoAdd = {
    type: string;
    value: number;
    quantity?: number | null;
    product_ids?: string[] | null;
    bundle_product_ids?: string[] | null;
    trigger_product_ids?: string[] | null;
  };
  const p = promotion as unknown as PromoAdd;

  let productIds: string[];
  if (p.type === "buy_x_get_y_free") {
    const triggerIds = (p.trigger_product_ids ?? []) as string[];
    const freeIds = (p.product_ids ?? []) as string[];
    productIds = [...new Set([...triggerIds, ...freeIds])].filter(Boolean);
  } else {
    productIds = [
      ...(p.product_ids ?? []),
      ...(p.bundle_product_ids ?? []),
    ].filter(Boolean) as string[];
  }
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
  const promoValue = Number(p.value);
  const promoQty = Number(p.quantity ?? 1);

  const isBundle = p.type === "bundle_price";
  const isBuyXGetY = p.type === "buy_x_get_y_free";
  const triggerIds = new Set((p.trigger_product_ids ?? []) as string[]);
  const bundleTotalUnits =
    isBundle && uniqueIds.length === 1 ? promoQty : uniqueIds.length;

  for (const pid of uniqueIds) {
    const basePrice: number = productsMap.get(pid) ?? 0;
    let finalPrice: number;

    if (isBuyXGetY) {
      finalPrice = triggerIds.has(pid) ? basePrice : 0;
    } else {
      switch (p.type) {
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
    }

    const qty = isBundle ? (uniqueIds.length === 1 ? promoQty : 1) : 1;
    const { data: existing } = await supabase
      .from("public_cart_items")
      .select("quantity")
      .eq("cart_id", cartId)
      .eq("product_id", pid)
      .single();

    const newQty = existing ? (existing.quantity as number) + qty : qty;

    const { error: upsertErr } = await supabase
      .from("public_cart_items")
      .upsert(
        {
          cart_id: cartId,
          product_id: pid,
          quantity: newQty,
          price_snapshot: Math.round(finalPrice * 100) / 100,
          promotion_id: promotionId,
          quantity_free: isBuyXGetY && !triggerIds.has(pid) ? qty : 0,
        },
        { onConflict: "cart_id,product_id", ignoreDuplicates: false }
      );

    if (upsertErr) {
      return NextResponse.json({ error: upsertErr.message }, { status: 500 });
    }
  }

  await recalcAndPersist(supabase, tenantId, cartId);
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
    .select("id, tenant_id")
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

  if (cart?.tenant_id) {
    await recalcAndPersist(supabase, cart.tenant_id, cart_id);
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
    .select("id, tenant_id")
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

  if (cart.tenant_id) {
    await recalcAndPersist(supabase, cart.tenant_id, cartId);
  }
  return NextResponse.json({ success: true });
}
