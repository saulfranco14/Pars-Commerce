/**
 * Shared contracts for the customer bill summary. Kept out of the component so
 * the presentational layer stays free of inline interfaces (ARCHITECTURE.md §7)
 * and the grouping/payability helpers can consume the same shapes.
 */

export interface BillItem {
  id: string;
  product_name: string;
  quantity: number;
  unit_price: number;
  subtotal: number;
  added_by_device_id: string | null;
  is_shared: boolean;
  origin_table_label: string | null;
  /** Per-line preparation state: received | in_progress | ready. */
  fulfillment_status?: string;
}

export interface BillDevice {
  id: string;
  display_name: string | null;
  color_hex: string;
  /** Per-person preparation state: received | in_progress | ready. */
  fulfillment_status?: string;
}

/** One person's items on the bill, with their resolved label and subtotal. */
export interface PersonItemsGroup {
  /** device id, or the shared sentinel. */
  key: string;
  items: BillItem[];
  label: string;
  color: string;
  isMine: boolean;
  subtotal: number;
}
