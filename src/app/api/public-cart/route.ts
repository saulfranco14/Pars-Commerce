/* eslint-disable @typescript-eslint/no-explicit-any -- product_variants is not in the generated Supabase types yet. */
import { NextResponse } from "next/server";

import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";

import { serviceErrorToResponse } from "@/features/qr/services/serviceErrorToResponse";
import {
  addProductLine,
  addPromotionGroup,
  removeLine,
  setLineQuantity,
} from "@/features/checkout/services/cartLineService";
import { addPlanToCart, listCartPlans, removePlanFromCart } from "@/features/checkout/services/cartPlanService";

const FINGERPRINT_HEADER = "x-fingerprint-id";
type CommerceAdmin = { from: (table: string) => any };
type PublicCartRow = {
  id: string;
  product_id: string;
  product_variant_id: string | null;
  quantity: number;
  price_snapshot: number | string;
  list_unit_price: number | string | null;
  promotion_id: string | null;
  group_id: string | null;
  group_unit_quantity: number | null;
  product: { id: string; name: string; slug: string; image_url: string | null } | null;
  promotion: { id: string; name: string; type: string } | null;
};

function getFingerprint(request: Request): string | null {
  return request.headers.get(FINGERPRINT_HEADER)?.trim() || null;
}

async function findOwnedCart(cartId: string, fingerprint: string): Promise<boolean> {
  const supabase = await createClient();
  const { data } = await supabase
    .from("public_carts")
    .select("id")
    .eq("id", cartId)
    .eq("fingerprint_id", fingerprint)
    .maybeSingle();
  return Boolean(data);
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
    return NextResponse.json({ cart: null, items: [], plans: [], plans_total: 0 });
  }

  const { data: items, error: itemsError } = await supabase
    .from("public_cart_items")
    .select(`
      id,
      product_id,
      product_variant_id,
      quantity,
      price_snapshot,
      list_unit_price,
      promotion_id,
      group_id,
      group_unit_quantity,
      product:products(id, name, slug, image_url),
      promotion:promotions(id, name, type)
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
  const plans = await listCartPlans(createAdminClient(), cart.id);
  const plansTotal = plans.reduce((sum, plan) => sum + plan.price_snapshot, 0);
  const itemsCount = hydratedItems.reduce((sum, i) => sum + i.quantity, 0) + plans.length;

  return NextResponse.json({
    cart: { id: cart.id, tenant_id: cart.tenant_id },
    items: hydratedItems,
    subtotal,
    items_count: itemsCount,
    plans,
    plans_total: plansTotal,
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

  let body: {
    tenant_id?: string;
    product_id?: string;
    product_variant_id?: string;
    promotion_id?: string;
    plan_id?: string;
    quantity?: number;
  };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const { tenant_id, product_id, product_variant_id, promotion_id, plan_id, quantity = 1 } = body;

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

  const admin = createAdminClient();
  const result = plan_id
    ? await addPlanToCart(admin, { cartId, tenantId: tenant_id, planId: plan_id })
    : promotion_id
    ? await addPromotionGroup(admin, { cartId, tenantId: tenant_id, promotionId: promotion_id, productId: product_id ?? null })
    : product_id
      ? await addProductLine(admin, {
          cartId,
          tenantId: tenant_id,
          productId: product_id,
          variantId: product_variant_id ?? null,
          quantity,
        })
      : null;

  if (!result) {
    return NextResponse.json(
      { error: "product_id and quantity (>= 1) are required when not adding promotion" },
      { status: 400 }
    );
  }
  if (!result.ok) return serviceErrorToResponse(result.error);

  return NextResponse.json({ success: true, cart_id: cartId });
}

export async function PATCH(request: Request) {
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

  if (!(await findOwnedCart(cart_id, fingerprint))) {
    return NextResponse.json({ error: "Cart not found" }, { status: 404 });
  }

  if (quantity !== undefined) {
    const result = await setLineQuantity(createAdminClient(), { cartId: cart_id, itemId: item_id, quantity });
    if (!result.ok) return serviceErrorToResponse(result.error);
  }

  return NextResponse.json({ success: true });
}

export async function DELETE(request: Request) {
  const fingerprint = getFingerprint(request);
  const { searchParams } = new URL(request.url);
  const cartId = searchParams.get("cart_id");
  const itemId = searchParams.get("item_id");
  const planLineId = searchParams.get("plan_line_id");

  if (!fingerprint || !cartId || (!itemId && !planLineId)) {
    return NextResponse.json(
      { error: "x-fingerprint-id header, cart_id and item_id or plan_line_id are required" },
      { status: 400 }
    );
  }

  if (!(await findOwnedCart(cartId, fingerprint))) {
    return NextResponse.json({ error: "Cart not found" }, { status: 404 });
  }

  const result = planLineId
    ? await removePlanFromCart(createAdminClient(), { cartId, planLineId })
    : await removeLine(createAdminClient(), { cartId, itemId: itemId as string });
  if (!result.ok) return serviceErrorToResponse(result.error);

  return NextResponse.json({ success: true });
}
