/**
 * Pure helper: turn requested items + a server-side price map into validated
 * order_items rows. Shared by the customer items route and the staff order
 * service so pricing/attribution logic lives in ONE place (SRP), never trusting
 * client-sent prices. No I/O.
 */

export interface RequestedItem {
  product_id: string;
  quantity: number;
  is_shared?: boolean;
}

export interface OrderItemRow {
  order_id: string;
  product_id: string;
  quantity: number;
  unit_price: number;
  list_unit_price: number;
  subtotal: number;
  promotion_id: string | null;
  offer_group_id: string | null;
  added_by_device_id: string | null;
  added_by_member_id: string | null;
  is_shared: boolean;
  origin_table_label: string | null;
}

export interface BuildOrderItemRowsInput {
  orderId: string;
  items: RequestedItem[];
  /** product_id → unit price, resolved server-side from the products table. */
  priceByProduct: Map<string, number>;
  priceSnapshotsByProduct?: Map<string, {
    unitPrice: number;
    listUnitPrice: number;
    promotionId: string | null;
    offerGroupId: string | null;
  }>;
  /** Who added them: a customer device, or a staff membership (mutually excl.). */
  addedByDeviceId?: string | null;
  addedByMemberId?: string | null;
  originTableLabel?: string | null;
}

/** Keep only positive-qty items with a known product id. */
export function filterValidItems(items: RequestedItem[]): RequestedItem[] {
  return items.filter(
    (item) =>
      !!item.product_id &&
      Number.isFinite(Number(item.quantity)) &&
      Number(item.quantity) > 0,
  );
}

export function buildOrderItemRows(
  input: BuildOrderItemRowsInput,
): OrderItemRow[] {
  const rows: OrderItemRow[] = [];
  for (const item of filterValidItems(input.items)) {
    const snapshot = input.priceSnapshotsByProduct?.get(item.product_id);
    const unitPrice = snapshot?.unitPrice ?? input.priceByProduct.get(item.product_id);
    if (unitPrice === undefined) continue;
    const quantity = Number(item.quantity);
    rows.push({
      order_id: input.orderId,
      product_id: item.product_id,
      quantity,
      unit_price: unitPrice,
      list_unit_price: snapshot?.listUnitPrice ?? unitPrice,
      subtotal: unitPrice * quantity,
      promotion_id: snapshot?.promotionId ?? null,
      offer_group_id: snapshot?.offerGroupId ?? null,
      added_by_device_id: input.addedByDeviceId ?? null,
      added_by_member_id: input.addedByMemberId ?? null,
      is_shared: item.is_shared === true,
      origin_table_label: input.originTableLabel ?? null,
    });
  }
  return rows;
}
