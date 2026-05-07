import { createAdminClient } from "@/lib/supabase/admin";

import type { CartItemRow } from "@/features/checkout/helpers/cartItemMappers";

export async function createOrderItems(
  admin: ReturnType<typeof createAdminClient>,
  orderId: string,
  cartItems: CartItemRow[],
) {
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
    };
  });

  const { error } = await admin.from("order_items").insert(rows);
  if (error) throw new Error(error.message);
}
