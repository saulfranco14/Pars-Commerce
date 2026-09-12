export interface TableOrder {
  id: string;
  status: string;
  subtotal: number;
  total: number;
  paid_total: number;
  balance_due: number;
}

export interface TableOrderItem {
  id: string;
  product_id: string;
  quantity: number;
  unit_price: number;
  subtotal: number;
  added_by_device_id?: string | null;
  is_shared?: boolean;
}
