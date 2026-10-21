/* eslint-disable @typescript-eslint/no-explicit-any -- product_variants and the new cart columns are not in the generated Supabase types yet. */
/**
 * Every write to `public_cart_items` goes through here. Packs and NxM are
 * stored as a group (shared `group_id`) so their lines change and disappear
 * together and a customer can never keep a pack price on a partial pack.
 */
import type { SupabaseClient } from "@supabase/supabase-js";

import {
  allocatePackPrice,
  bestUnitPromotion,
  isPromotionLive,
  nxmUnitPrice,
  roundMoney,
  UNIT_PROMOTION_TYPES,
  type PricingPromotion,
} from "@/lib/offers/pricing";

import type { ServiceResult } from "@/features/qr/services/tablePaymentService";
import type {
  AddProductLineInput,
  AddPromotionGroupInput,
  CartLineRecord,
  CartPromotionRecord,
  SetLineQuantityInput,
  CartLineChangeInput,
} from "@/features/checkout/interfaces/cartLines";

type Admin = SupabaseClient;
type Loose = { from: (table: string) => any };

export const CART_LINE_COLUMNS =
  "id, cart_id, product_id, product_variant_id, quantity, price_snapshot, list_unit_price, promotion_id, group_id, group_unit_quantity";

export const CART_PROMOTION_COLUMNS =
  "id, type, value, status, applies_to, quantity, buy_quantity, pay_quantity, product_ids, subcatalog_ids, bundle_product_ids, valid_from, valid_until";

function loose(admin: Admin): Loose {
  return admin as unknown as Loose;
}

function fail(code: "not_found" | "validation" | "conflict" | "internal", message: string): ServiceResult<never> {
  return { ok: false, error: { code, message } };
}

export async function loadLivePromotions(admin: Admin, tenantId: string, now: Date = new Date()): Promise<PricingPromotion[]> {
  const { data } = await loose(admin)
    .from("promotions")
    .select(CART_PROMOTION_COLUMNS)
    .eq("tenant_id", tenantId)
    .eq("status", "active");
  return ((data ?? []) as CartPromotionRecord[])
    .filter((promotion) => isPromotionLive(promotion, now))
    .map((promotion) => ({ ...promotion, value: Number(promotion.value) }));
}

async function findStandaloneLine(admin: Admin, cartId: string, productId: string, variantId: string | null) {
  let query = loose(admin)
    .from("public_cart_items")
    .select(CART_LINE_COLUMNS)
    .eq("cart_id", cartId)
    .eq("product_id", productId)
    .is("group_id", null);
  query = variantId ? query.eq("product_variant_id", variantId) : query.is("product_variant_id", null);
  const { data } = await query.maybeSingle();
  return (data as CartLineRecord | null) ?? null;
}

export async function addProductLine(admin: Admin, input: AddProductLineInput): Promise<ServiceResult<{ cartId: string }>> {
  if (!Number.isInteger(input.quantity) || input.quantity < 1) {
    return fail("validation", "La cantidad debe ser al menos 1.");
  }
  const db = loose(admin);
  const { data: product } = await db
    .from("products")
    .select("id, price, has_variants, subcatalog_id")
    .eq("id", input.productId)
    .eq("tenant_id", input.tenantId)
    .eq("is_public", true)
    .is("deleted_at", null)
    .maybeSingle();
  if (!product) return fail("not_found", "Este producto ya no está disponible.");

  const variantId = input.variantId ?? null;
  if (product.has_variants && !variantId) {
    return fail("validation", "Elige talla o color antes de agregar este producto.");
  }

  let listPrice = Number(product.price);
  let variantStock: { track: boolean; stock: number } | null = null;
  if (variantId) {
    const { data: variant } = await db
      .from("product_variants")
      .select("id, price, stock, track_stock, is_active, archived_at")
      .eq("id", variantId)
      .eq("product_id", input.productId)
      .maybeSingle();
    if (!variant || variant.is_active !== true || variant.archived_at) {
      return fail("conflict", "Esta combinación ya no está disponible.");
    }
    listPrice = Number(variant.price);
    variantStock = { track: Boolean(variant.track_stock), stock: Number(variant.stock) };
  }

  const promotions = await loadLivePromotions(admin, input.tenantId);
  const best = bestUnitPromotion(promotions, { id: product.id, price: listPrice, subcatalog_id: product.subcatalog_id });
  const priceSnapshot = best?.finalPrice ?? listPrice;

  const existing = await findStandaloneLine(admin, input.cartId, input.productId, variantId);
  const nextQuantity = (existing?.quantity ?? 0) + input.quantity;
  if (variantStock?.track && variantStock.stock < nextQuantity) {
    return fail("conflict", `Sólo hay ${variantStock.stock} piezas disponibles de esta combinación.`);
  }

  const values = {
    quantity: nextQuantity,
    price_snapshot: roundMoney(priceSnapshot),
    list_unit_price: roundMoney(listPrice),
    promotion_id: best?.promotionId ?? null,
  };
  const result = existing
    ? await db.from("public_cart_items").update(values).eq("id", existing.id)
    : await db.from("public_cart_items").insert({
        ...values,
        cart_id: input.cartId,
        product_id: input.productId,
        product_variant_id: variantId,
        group_id: null,
        group_unit_quantity: null,
      });
  if (result.error) return fail("internal", result.error.message);
  return { ok: true, data: { cartId: input.cartId } };
}

interface GroupPlanLine {
  productId: string;
  unitQuantity: number;
  listUnitPrice: number;
  unitPrice: number;
}

/** Lines one pack of the promotion adds, priced so the pack totals its promoted price. */
export function planPromotionGroup(
  promotion: CartPromotionRecord,
  listPrices: Map<string, number>,
  chosenProductId?: string | null,
): ServiceResult<GroupPlanLine[]> {
  if (promotion.type === "nxm") {
    const eligible = [...new Set(promotion.product_ids ?? [])];
    const productId = chosenProductId && eligible.includes(chosenProductId)
      ? chosenProductId
      : eligible.length === 1 ? eligible[0] : null;
    if (!productId) return fail("validation", "Elige el producto de la promoción desde su página.");
    const buy = Number(promotion.buy_quantity ?? 0);
    const pay = Number(promotion.pay_quantity ?? 0);
    const listUnitPrice = listPrices.get(productId);
    if (listUnitPrice === undefined) return fail("not_found", "El producto de esta promoción ya no está disponible.");
    return {
      ok: true,
      data: [{ productId, unitQuantity: buy, listUnitPrice, unitPrice: nxmUnitPrice(listUnitPrice, buy, pay) }],
    };
  }

  const saved = promotion.promotion_items ?? [];
  const legacy = [...new Set([...(promotion.product_ids ?? []), ...(promotion.bundle_product_ids ?? [])])];
  const packLines = saved.length > 0
    ? saved.map((item) => ({ productId: item.product_id, unitQuantity: Number(item.quantity) }))
    : legacy.map((productId) => ({
        productId,
        unitQuantity: legacy.length === 1 ? Math.max(1, Number(promotion.quantity ?? 1)) : 1,
      }));
  if (packLines.length === 0) return fail("validation", "Esta promoción no tiene productos.");
  if (packLines.some((line) => !listPrices.has(line.productId))) {
    return fail("not_found", "Un producto de este paquete ya no está disponible.");
  }
  const prices = allocatePackPrice(
    packLines.map((line) => ({ key: line.productId, listUnitPrice: listPrices.get(line.productId) ?? 0, quantity: line.unitQuantity })),
    Number(promotion.value),
  );
  return {
    ok: true,
    data: packLines.map((line) => ({
      productId: line.productId,
      unitQuantity: line.unitQuantity,
      listUnitPrice: listPrices.get(line.productId) ?? 0,
      unitPrice: prices.get(line.productId) ?? 0,
    })),
  };
}

export async function addPromotionGroup(admin: Admin, input: AddPromotionGroupInput): Promise<ServiceResult<{ cartId: string }>> {
  const db = loose(admin);
  const { data } = await db
    .from("promotions")
    .select(`${CART_PROMOTION_COLUMNS}, promotion_items(product_id, quantity, position)`)
    .eq("id", input.promotionId)
    .eq("tenant_id", input.tenantId)
    .maybeSingle();
  const promotion = data as CartPromotionRecord | null;
  if (!promotion || !isPromotionLive(promotion)) return fail("conflict", "Esta promoción ya no está vigente.");

  if (UNIT_PROMOTION_TYPES.has(promotion.type)) {
    for (const productId of [...new Set(promotion.product_ids ?? [])]) {
      const added = await addProductLine(admin, { cartId: input.cartId, tenantId: input.tenantId, productId, quantity: 1 });
      if (!added.ok) return added;
    }
    return { ok: true, data: { cartId: input.cartId } };
  }
  if (promotion.type !== "bundle_price" && promotion.type !== "nxm") {
    return fail("validation", "Esta promoción se aplica sola al comprar; no se agrega al carrito.");
  }

  const candidateIds = [
    ...new Set([
      ...(promotion.promotion_items ?? []).map((item) => item.product_id),
      ...(promotion.product_ids ?? []),
      ...(promotion.bundle_product_ids ?? []),
    ]),
  ];
  const { data: products } = await db
    .from("products")
    .select("id, price, has_variants")
    .in("id", candidateIds)
    .eq("tenant_id", input.tenantId)
    .eq("is_public", true)
    .is("deleted_at", null);
  const rows = (products ?? []) as Array<{ id: string; price: number | string; has_variants: boolean | null }>;
  if (rows.some((row) => row.has_variants)) {
    return fail("validation", "Elige la talla o el color del producto antes de aplicar esta promoción.");
  }
  const plan = planPromotionGroup(promotion, new Map(rows.map((row) => [row.id, Number(row.price)])), input.productId);
  if (!plan.ok) return plan;

  const { data: existingLines } = await db
    .from("public_cart_items")
    .select(CART_LINE_COLUMNS)
    .eq("cart_id", input.cartId)
    .eq("promotion_id", promotion.id)
    .not("group_id", "is", null);
  const existing = (existingLines ?? []) as CartLineRecord[];
  const existingGroup = existing.find((line) => plan.data.some((planned) => planned.productId === line.product_id));

  if (existingGroup?.group_id) {
    for (const line of existing.filter((row) => row.group_id === existingGroup.group_id)) {
      const unit = line.group_unit_quantity ?? 1;
      const { error } = await db.from("public_cart_items").update({ quantity: line.quantity + unit }).eq("id", line.id);
      if (error) return fail("internal", error.message);
    }
    return { ok: true, data: { cartId: input.cartId } };
  }

  const groupId = crypto.randomUUID();
  const { error } = await db.from("public_cart_items").insert(
    plan.data.map((line) => ({
      cart_id: input.cartId,
      product_id: line.productId,
      product_variant_id: null,
      quantity: line.unitQuantity,
      group_id: groupId,
      group_unit_quantity: line.unitQuantity,
      price_snapshot: roundMoney(line.unitPrice),
      list_unit_price: roundMoney(line.listUnitPrice),
      promotion_id: promotion.id,
    })),
  );
  if (error) return fail("internal", error.message);
  return { ok: true, data: { cartId: input.cartId } };
}

async function loadLine(admin: Admin, input: CartLineChangeInput): Promise<CartLineRecord | null> {
  const { data } = await loose(admin)
    .from("public_cart_items")
    .select(CART_LINE_COLUMNS)
    .eq("id", input.itemId)
    .eq("cart_id", input.cartId)
    .maybeSingle();
  return (data as CartLineRecord | null) ?? null;
}

export async function removeLine(admin: Admin, input: CartLineChangeInput): Promise<ServiceResult<null>> {
  const line = await loadLine(admin, input);
  if (!line) return { ok: true, data: null };
  const db = loose(admin).from("public_cart_items").delete().eq("cart_id", input.cartId);
  const { error } = line.group_id ? await db.eq("group_id", line.group_id) : await db.eq("id", line.id);
  if (error) return fail("internal", error.message);
  return { ok: true, data: null };
}

/**
 * Standalone lines take the new quantity as is. A grouped line moves the whole
 * pack one step in the direction the customer pressed, so every line keeps its
 * proportion and the pack price stays honest.
 */
export async function setLineQuantity(admin: Admin, input: SetLineQuantityInput): Promise<ServiceResult<null>> {
  const line = await loadLine(admin, input);
  if (!line) return fail("not_found", "El artículo ya no está en el carrito.");
  const db = loose(admin);

  if (line.group_id) {
    const unit = line.group_unit_quantity ?? 1;
    const packs = Math.round(line.quantity / unit);
    const nextPacks = input.quantity > line.quantity ? packs + 1 : input.quantity < line.quantity ? packs - 1 : packs;
    if (nextPacks < 1) return removeLine(admin, input);
    const { data: groupLines } = await db
      .from("public_cart_items")
      .select(CART_LINE_COLUMNS)
      .eq("cart_id", input.cartId)
      .eq("group_id", line.group_id);
    for (const member of (groupLines ?? []) as CartLineRecord[]) {
      const { error } = await db
        .from("public_cart_items")
        .update({ quantity: (member.group_unit_quantity ?? 1) * nextPacks })
        .eq("id", member.id);
      if (error) return fail("internal", error.message);
    }
    return { ok: true, data: null };
  }

  if (input.quantity < 1) return removeLine(admin, input);
  if (line.product_variant_id) {
    const { data: variant } = await db
      .from("product_variants")
      .select("stock, track_stock, is_active, archived_at")
      .eq("id", line.product_variant_id)
      .maybeSingle();
    if (!variant || !variant.is_active || variant.archived_at) return fail("conflict", "Esta combinación ya no está disponible.");
    if (variant.track_stock && Number(variant.stock) < input.quantity) {
      return fail("conflict", `Sólo hay ${variant.stock} piezas disponibles de esta combinación.`);
    }
  }
  const { error } = await db.from("public_cart_items").update({ quantity: input.quantity }).eq("id", line.id);
  if (error) return fail("internal", error.message);
  return { ok: true, data: null };
}
