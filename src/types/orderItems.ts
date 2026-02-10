export interface CreateOrderItemPayload {
  order_id: string;
  product_id: string;
  quantity: number;
}

export interface OrderItemCreated {
  id: string;
  quantity: number;
  unit_price: number;
  subtotal: number;
}
