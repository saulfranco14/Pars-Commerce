import type { OrderItem } from "@/features/orders/interfaces/orderDetail";

/** Per-unit discount a promotion gave this line, against the list price saved at checkout. */
export function promotionUnitSavings(item: OrderItem): number {
  if (!item.promotion || item.list_unit_price == null) return 0;
  return Math.max(0, Number(item.list_unit_price) - Number(item.unit_price));
}
