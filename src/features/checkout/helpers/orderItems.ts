/* eslint-disable @typescript-eslint/no-explicit-any -- Commerce schema types are regenerated after the migration rollout. */
import { createAdminClient } from "@/lib/supabase/admin";

import type { CartItemRow } from "@/features/checkout/helpers/cartItemMappers";

type CommerceAdmin = { from: (table: string) => any };

export async function createOrderItems(
  admin: ReturnType<typeof createAdminClient>,
  orderId: string,
  cartItems: CartItemRow[],
) {
  const variantIds = cartItems.flatMap((item) => item.product_variant_id ? [item.product_variant_id] : []);
  const variantSnapshots = new Map<string, { id: string; sku: string | null; price: number; stock: number; selection_key: string }>();
  if (variantIds.length > 0) {
    const commerce = admin as unknown as CommerceAdmin;
    const { data: variants } = await commerce.from("product_variants").select("id, sku, price, stock, selection_key").in("id", variantIds);
    for (const variant of variants ?? []) variantSnapshots.set(variant.id, variant);
  }
  const rows = cartItems.map((item) => {
    const unitPrice = Number(item.price_snapshot);
    const subtotal = unitPrice * item.quantity;
    return {
      order_id: orderId,
      product_id: item.product_id,
      quantity: item.quantity,
      unit_price: unitPrice,
      subtotal,
      promotion_id: item.promotion_id ?? null,
      list_unit_price: item.list_unit_price === null || item.list_unit_price === undefined ? null : Number(item.list_unit_price),
      offer_group_id: item.group_id ?? null,
      product_variant_id: item.product_variant_id ?? null,
      variant_snapshot: item.product_variant_id ? variantSnapshots.get(item.product_variant_id) ?? null : null,
    };
  });

  const { error } = await admin.from("order_items").insert(rows);
  if (error) throw new Error(error.message);
}
