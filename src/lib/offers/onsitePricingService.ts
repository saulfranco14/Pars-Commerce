/* eslint-disable @typescript-eslint/no-explicit-any -- shared service accepts the generated client while promotion joins are normalized at this boundary. */
import type { SupabaseClient } from "@supabase/supabase-js";

import { priceOrder } from "@/lib/offers/orderPricing";
import type { RequestedItem } from "@/features/qr/helpers/buildOrderItemRows";

type Loose = { from: (table: string) => any };

export interface OnsitePriceSnapshot {
  unitPrice: number;
  listUnitPrice: number;
  promotionId: string | null;
  offerGroupId: string | null;
}

/** Server-side onsite pricing shared by staff and kiosk order creation. */
export async function loadOnsitePriceSnapshots(
  admin: SupabaseClient,
  tenantId: string,
  items: RequestedItem[],
): Promise<Map<string, OnsitePriceSnapshot>> {
  const db = admin as unknown as Loose;
  const ids = [...new Set(items.map((item) => item.product_id))];
  const [{ data: products }, { data: promotions }, { data: tenant }] = await Promise.all([
    db.from("products").select("id, price, subcatalog_id").eq("tenant_id", tenantId).in("id", ids).is("deleted_at", null),
    db.from("promotions")
      .select("id, name, type, value, status, applies_to, product_ids, subcatalog_ids, bundle_product_ids, quantity, buy_quantity, pay_quantity, valid_from, valid_until, min_amount, sales_channels, promotion_items(product_id, quantity, position)")
      .eq("tenant_id", tenantId)
      .eq("status", "active")
      .contains("sales_channels", ["onsite"]),
    db.from("tenants").select("onsite_promotions_enabled").eq("id", tenantId).single(),
  ]);
  const result = priceOrder({
    products: (products ?? []).map((product: any) => ({ ...product, price: Number(product.price) })),
    promotions: (promotions ?? []).map((promotion: any) => ({ ...promotion, value: Number(promotion.value), min_amount: Number(promotion.min_amount ?? 0) })),
    intents: items.map((item) => ({ productId: item.product_id, quantity: Number(item.quantity), isShared: item.is_shared === true })),
    channel: "onsite",
    onsitePromotionsEnabled: tenant?.onsite_promotions_enabled !== false,
  });
  if (!result.ok) return new Map();
  return new Map(result.lines.map((line) => [line.productId, {
    unitPrice: line.unitPrice,
    listUnitPrice: line.listUnitPrice,
    promotionId: line.promotionId,
    offerGroupId: line.offerGroupId,
  }]));
}
