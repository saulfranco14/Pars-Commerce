/* eslint-disable @typescript-eslint/no-explicit-any -- product_variants and the new cart columns are not in the generated Supabase types yet. */
/**
 * Checkout must charge today's prices, not whatever the cart remembered when
 * the item was added. This recomputes every line against live products and
 * promotions, writes the corrections, and reports whether anything moved so
 * the caller can stop and show the customer the new total.
 */
import type { SupabaseClient } from "@supabase/supabase-js";

import { bestUnitPromotion, roundMoney } from "@/lib/offers/pricing";
import { planPromotionGroup } from "@/lib/offers/groupPricing";

import {
  CART_LINE_COLUMNS,
  CART_PROMOTION_COLUMNS,
  loadLivePromotions,
} from "@/features/checkout/services/cartLineService";

import type { ServiceResult } from "@/features/qr/services/tablePaymentService";
import type {
  CartLineRecord,
  CartProductRecord,
  CartPromotionRecord,
  RepriceResult,
} from "@/features/checkout/interfaces/cartLines";

type Admin = SupabaseClient;
type Loose = { from: (table: string) => any };

const PRICE_TOLERANCE = 0.005;

interface LineUpdate {
  id: string;
  values: Record<string, unknown>;
}

function samePrice(left: number | string | null, right: number): boolean {
  return left !== null && Math.abs(Number(left) - right) < PRICE_TOLERANCE;
}

export async function repriceCart(
  admin: Admin,
  input: { tenantId: string; cartId: string },
): Promise<ServiceResult<RepriceResult>> {
  const db = admin as unknown as Loose;
  const { data: lineRows, error } = await db
    .from("public_cart_items")
    .select(CART_LINE_COLUMNS)
    .eq("cart_id", input.cartId);
  if (error) return { ok: false, error: { code: "internal", message: error.message } };
  const lines = (lineRows ?? []) as CartLineRecord[];
  if (lines.length === 0) return { ok: true, data: { changed: false } };

  const productIds = [...new Set(lines.map((line) => line.product_id))];
  const variantIds = [...new Set(lines.flatMap((line) => (line.product_variant_id ? [line.product_variant_id] : [])))];
  const [productsRes, variantsRes, promotions] = await Promise.all([
    db.from("products").select("id, price, has_variants, subcatalog_id, is_public, deleted_at").in("id", productIds).eq("tenant_id", input.tenantId),
    variantIds.length > 0
      ? db.from("product_variants").select("id, price, is_active, archived_at").in("id", variantIds)
      : Promise.resolve({ data: [] }),
    loadLivePromotions(admin, input.tenantId),
  ]);
  const products = new Map(((productsRes.data ?? []) as CartProductRecord[]).map((row) => [row.id, row]));
  const variants = new Map(
    ((variantsRes.data ?? []) as Array<{ id: string; price: number | string; is_active: boolean; archived_at: string | null }>).map((row) => [row.id, row]),
  );
  const livePromotionIds = new Set(promotions.map((promotion) => promotion.id));
  const cartListSubtotal = roundMoney(lines.reduce((sum, line) => {
    const product = products.get(line.product_id);
    const variant = line.product_variant_id ? variants.get(line.product_variant_id) : null;
    return sum + Number(variant?.price ?? product?.price ?? line.list_unit_price ?? line.price_snapshot) * line.quantity;
  }, 0));

  const removals: string[] = [];
  const updates: LineUpdate[] = [];

  const listPriceOf = (line: CartLineRecord): number | null => {
    const product = products.get(line.product_id);
    if (!product || product.is_public !== true || product.deleted_at) return null;
    if (line.product_variant_id) {
      const variant = variants.get(line.product_variant_id);
      if (!variant || !variant.is_active || variant.archived_at) return null;
      return Number(variant.price);
    }
    return Number(product.price);
  };

  const priceStandalone = (line: CartLineRecord, extra: Record<string, unknown> = {}) => {
    const listPrice = listPriceOf(line);
    if (listPrice === null) {
      removals.push(line.id);
      return;
    }
    const product = products.get(line.product_id);
    const best = bestUnitPromotion(
      promotions,
      { id: line.product_id, price: listPrice, subcatalog_id: product?.subcatalog_id ?? null },
      new Date(),
      { channel: "public_store", cartListSubtotal },
    );
    const price = roundMoney(best?.finalPrice ?? listPrice);
    const promotionId = best?.promotionId ?? null;
    if (!samePrice(line.price_snapshot, price) || line.promotion_id !== promotionId || Object.keys(extra).length > 0) {
      updates.push({ id: line.id, values: { ...extra, price_snapshot: price, list_unit_price: roundMoney(listPrice), promotion_id: promotionId } });
    }
  };

  for (const line of lines.filter((row) => !row.group_id)) priceStandalone(line);

  const groups = new Map<string, CartLineRecord[]>();
  for (const line of lines.filter((row) => row.group_id)) {
    const list = groups.get(line.group_id as string) ?? [];
    list.push(line);
    groups.set(line.group_id as string, list);
  }

  for (const groupLines of groups.values()) {
    const promotionId = groupLines[0].promotion_id;
    let promotion: CartPromotionRecord | null = null;
    if (promotionId && livePromotionIds.has(promotionId)) {
      const { data } = await db
        .from("promotions")
        .select(`${CART_PROMOTION_COLUMNS}, promotion_items(product_id, quantity, position)`)
        .eq("id", promotionId)
        .maybeSingle();
      promotion = (data as CartPromotionRecord | null) ?? null;
      if (promotion && Number(promotion.min_amount ?? 0) > cartListSubtotal) {
        promotion = null;
      }
    }
    const listPrices = new Map<string, number>();
    for (const line of groupLines) {
      const listPrice = listPriceOf(line);
      if (listPrice !== null) listPrices.set(line.product_id, listPrice);
    }
    const plan = promotion ? planPromotionGroup(promotion, listPrices, groupLines[0].product_id) : null;
    const planMatches = plan?.ok && plan.data.length === groupLines.length
      && plan.data.every((planned) => groupLines.some((line) => line.product_id === planned.productId && (line.group_unit_quantity ?? 1) === planned.unitQuantity));

    if (plan?.ok && planMatches) {
      for (const line of groupLines) {
        const planned = plan.data.find((entry) => entry.productId === line.product_id);
        if (!planned) continue;
        const price = roundMoney(planned.unitPrice);
        if (!samePrice(line.price_snapshot, price)) {
          updates.push({ id: line.id, values: { price_snapshot: price, list_unit_price: roundMoney(planned.listUnitPrice) } });
        }
      }
      continue;
    }

    // The pack is no longer valid: each line goes back to a normal priced line.
    for (const line of groupLines) {
      const standalone = lines.find(
        (row) => !row.group_id && row.product_id === line.product_id && row.product_variant_id === line.product_variant_id && !removals.includes(row.id),
      );
      if (standalone) {
        removals.push(line.id);
        const pending = updates.find((update) => update.id === standalone.id);
        const quantity = Number(pending?.values.quantity ?? standalone.quantity) + line.quantity;
        if (pending) pending.values.quantity = quantity;
        else updates.push({ id: standalone.id, values: { quantity } });
      } else {
        priceStandalone(line, { group_id: null, group_unit_quantity: null });
      }
    }
  }

  for (const id of removals) {
    const { error: deleteError } = await db.from("public_cart_items").delete().eq("id", id);
    if (deleteError) return { ok: false, error: { code: "internal", message: deleteError.message } };
  }
  for (const update of updates) {
    if (removals.includes(update.id)) continue;
    const { error: updateError } = await db.from("public_cart_items").update(update.values).eq("id", update.id);
    if (updateError) return { ok: false, error: { code: "internal", message: updateError.message } };
  }

  return { ok: true, data: { changed: removals.length > 0 || updates.length > 0 } };
}
