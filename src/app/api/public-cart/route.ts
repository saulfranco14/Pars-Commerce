import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
/* eslint-disable @typescript-eslint/no-explicit-any -- Commerce schema types are regenerated after the migration rollout. */
import { NextResponse } from "next/server";
import {
  buildProductPromoMap,
  type PromotionForPrice,
} from "@/lib/promotionPrice";

const FINGERPRINT_HEADER = "x-fingerprint-id";
type CommerceAdmin = { from: (table: string) => any };
type PublicCartRow = {
  id: string;
  product_id: string;
  product_variant_id: string | null;
  quantity: number;
  price_snapshot: number | string;
  promotion_id: string | null;
  product: { id: string; name: string; slug: string; image_url: string | null } | null;
};

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
      product_variant_id,
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

  const rawItems = (items ?? []) as unknown as PublicCartRow[];
  const variantIds = rawItems.flatMap((item) => item.product_variant_id ? [item.product_variant_id] : []);
  const variantById = new Map<string, { id: string; selection_key: string; image_url: string | null }>();
  if (variantIds.length > 0) {
    const commerce = createAdminClient() as unknown as CommerceAdmin;
    const { data: variants } = await commerce.from("product_variants").select("id, selection_key, image_url").in("id", variantIds);
    for (const variant of variants ?? []) variantById.set(variant.id, variant);
  }
  const hydratedItems = rawItems.map((item) => ({
    ...item,
    variant: item.product_variant_id ? variantById.get(item.product_variant_id) ?? null : null,
  }));

  const subtotal = hydratedItems.reduce(
    (sum, i) => sum + Number(i.price_snapshot) * i.quantity,
    0
  );
  const itemsCount = hydratedItems.reduce((sum, i) => sum + i.quantity, 0);

  return NextResponse.json({
    cart: { id: cart.id, tenant_id: cart.tenant_id },
    items: hydratedItems,
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

  let body: { tenant_id?: string; product_id?: string; product_variant_id?: string; promotion_id?: string; quantity?: number };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const { tenant_id, product_id, product_variant_id, promotion_id, quantity = 1 } = body;

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

  const commerce = createAdminClient() as unknown as CommerceAdmin;
  const { data: product, error: productError } = await commerce
    .from("products")
    .select("id, price, has_variants")
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

  const basePrice = Number(product.price);
  let priceSnapshot = basePrice;
  let promotionId: string | null = null;
  let selectedVariant: { id: string; price: number | string; stock: number; track_stock: boolean; is_active: boolean; archived_at: string | null } | null = null;
  if (product.has_variants && !product_variant_id) {
    return NextResponse.json({ error: "Elige talla o color antes de agregar este producto." }, { status: 400 });
  }
  if (product_variant_id) {
    const { data: variant } = await commerce
      .from("product_variants")
      .select("id, price, stock, track_stock, is_active, archived_at")
      .eq("id", product_variant_id)
      .eq("product_id", product_id)
      .maybeSingle();
    if (!variant || variant.is_active !== true || variant.archived_at) {
      return NextResponse.json({ error: "Esta combinación ya no está disponible." }, { status: 409 });
    }
    if (variant.track_stock && Number(variant.stock) < quantity) {
      return NextResponse.json({ error: "No hay existencias suficientes para esta combinación." }, { status: 409 });
    }
    selectedVariant = variant;
    priceSnapshot = Number(variant.price);
  }

  const { data: promotions } = await supabase
    .from("promotions")
    .select("id, type, value, quantity, product_ids, bundle_product_ids, valid_from, valid_until")
    .eq("tenant_id", tenant_id);

  const now = new Date();
  const activePromos = (promotions ?? []).filter((p) => {
    const from = p.valid_from ? new Date(p.valid_from) : null;
    const until = p.valid_until ? new Date(p.valid_until) : null;
    if (from && from > now) return false;
    if (until && until < now) return false;
    return true;
  });

  const promosForPrice: PromotionForPrice[] = activePromos.map((p) => ({
    id: p.id,
    type: p.type,
    value: Number(p.value),
    quantity: p.quantity,
    product_ids: p.product_ids,
    bundle_product_ids: p.bundle_product_ids,
  }));

  const promoMap = buildProductPromoMap(
    promosForPrice,
    [product_id],
    new Map([[product_id, basePrice]])
  );
  const promo = promoMap.get(product_id);
  if (promo && promo.finalPrice < basePrice) {
    priceSnapshot = promo.finalPrice;
    promotionId = promo.promotionId;
  }

  const upsertData: {
    cart_id: string;
    product_id: string;
    quantity: number;
    price_snapshot: number;
    promotion_id?: string | null;
    product_variant_id: string | null;
  } = {
    cart_id: cartId,
    product_id: product_id,
    quantity,
    price_snapshot: Math.round(priceSnapshot * 100) / 100,
    product_variant_id: product_variant_id ?? null,
  };
  if (promotionId) upsertData.promotion_id = promotionId;

  if (product_variant_id) {
    const { data: line } = await commerce.from("public_cart_items").select("id, quantity").eq("cart_id", cartId).eq("product_id", product_id).eq("product_variant_id", product_variant_id).maybeSingle();
    const nextQuantity = Number(line?.quantity ?? 0) + quantity;
    if (selectedVariant?.track_stock && Number(selectedVariant.stock) < nextQuantity) {
      return NextResponse.json({ error: `Sólo hay ${selectedVariant.stock} piezas disponibles de esta combinación.` }, { status: 409 });
    }
    const result = line
      ? await commerce.from("public_cart_items").update({ quantity: nextQuantity, price_snapshot: upsertData.price_snapshot, promotion_id: promotionId }).eq("id", line.id)
      : await commerce.from("public_cart_items").insert(upsertData);
    if (result.error) return NextResponse.json({ error: result.error.message }, { status: 500 });
    return NextResponse.json({ success: true, cart_id: cartId });
  }

  const { error: upsertError } = await supabase
    .from("public_cart_items")
    .upsert(upsertData, {
      onConflict: "cart_id,product_id,product_variant_id",
      ignoreDuplicates: false,
    });

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
): Promise<NextResponse> {
  const { data: promotion, error: promoError } = await supabase
    .from("promotions")
    .select("id, type, value, quantity, product_ids, bundle_product_ids, promotion_items(product_id, quantity, position)")
    .eq("id", promotionId)
    .eq("tenant_id", tenantId)
    .single();

  if (promoError || !promotion) {
    return NextResponse.json(
      { error: "Promotion not found" },
      { status: 404 }
    );
  }

  const savedPackItems = promotion.promotion_items ?? [];
  const legacyProductIds = [
    ...(promotion.product_ids ?? []),
    ...(promotion.bundle_product_ids ?? []),
  ].filter(Boolean) as string[];
  const packItems = savedPackItems.length
    ? savedPackItems.map((item) => ({ product_id: item.product_id, quantity: Number(item.quantity) }))
    : [...new Set(legacyProductIds)].map((product_id) => ({
      product_id,
      quantity: promotion.type === "bundle_price" && legacyProductIds.length === 1 ? Number(promotion.quantity ?? 1) : 1,
    }));
  const uniqueIds = [...new Set(packItems.map((item) => item.product_id))];

  if (uniqueIds.length === 0) {
    return NextResponse.json(
      { error: "Promotion has no products" },
      { status: 400 }
    );
  }

  const commerce = supabase as unknown as CommerceAdmin;
  const { data: products } = await commerce
    .from("products")
    .select("id, price, has_variants")
    .in("id", uniqueIds)
    .eq("tenant_id", tenantId)
    .eq("is_public", true);

  const promotionProducts = (products ?? []) as Array<{
    id: string;
    price: number | string;
    has_variants?: boolean;
  }>;
  const productsMap = new Map(
    promotionProducts.map((p) => [p.id, Number(p.price)])
  );
  if (promotionProducts.some((product) => product.has_variants)) {
    return NextResponse.json(
      { error: "Elige la talla o el color del producto antes de aplicar esta promoción." },
      { status: 400 },
    );
  }
  const promoValue = Number(promotion.value);
  const isBundle = promotion.type === "bundle_price";
  const bundleTotalUnits = isBundle
    ? packItems.reduce((sum, item) => sum + item.quantity, 0)
    : uniqueIds.length;

  for (const line of packItems) {
    const pid = line.product_id;
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

    const qty = isBundle ? line.quantity : 1;
    const { error: upsertErr } = await supabase
      .from("public_cart_items")
      .upsert(
        {
          cart_id: cartId,
          product_id: pid,
          quantity: qty,
          price_snapshot: Math.round(finalPrice * 100) / 100,
          promotion_id: promotionId,
          product_variant_id: null,
        },
        { onConflict: "cart_id,product_id,product_variant_id", ignoreDuplicates: false }
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

  let body: { cart_id?: string; item_id?: string; quantity?: number };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const { cart_id, item_id, quantity } = body;

  if (!cart_id || !item_id) {
    return NextResponse.json(
      { error: "cart_id and item_id are required" },
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
        .eq("id", item_id);

      if (delError) {
        return NextResponse.json({ error: delError.message }, { status: 500 });
      }
    } else {
      const commerce = createAdminClient() as unknown as CommerceAdmin;
      const { data: cartLine } = await commerce.from("public_cart_items").select("id, product_variant_id").eq("id", item_id).eq("cart_id", cart_id).maybeSingle();
      if (!cartLine) return NextResponse.json({ error: "El artículo ya no está en el carrito." }, { status: 404 });
      if (cartLine.product_variant_id) {
        const { data: variant } = await commerce.from("product_variants").select("stock, is_active, archived_at").eq("id", cartLine.product_variant_id).maybeSingle();
        if (!variant || !variant.is_active || variant.archived_at) return NextResponse.json({ error: "Esta combinación ya no está disponible." }, { status: 409 });
        if (Number(variant.stock) < quantity) return NextResponse.json({ error: `Sólo hay ${variant.stock} piezas disponibles de esta combinación.` }, { status: 409 });
      }
      const { error: updateError } = await supabase
        .from("public_cart_items")
        .update({ quantity })
        .eq("cart_id", cart_id)
        .eq("id", item_id);

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
  const itemId = searchParams.get("item_id");

  if (!fingerprint || !cartId || !itemId) {
    return NextResponse.json(
      { error: "x-fingerprint-id header, cart_id and item_id are required" },
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
    .eq("id", itemId);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ success: true });
}
