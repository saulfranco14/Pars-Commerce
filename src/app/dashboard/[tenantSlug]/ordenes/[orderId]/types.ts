export interface OrderItem {
  id: string;
  quantity: number;
  unit_price: number;
  subtotal: number;
  product: { id: string; name: string; type: string } | null;
}

export interface OrderDetail {
  id: string;
  status: string;
  customer_name: string | null;
  customer_email: string | null;
  customer_phone: string | null;
  subtotal: number;
  discount: number;
  total: number;
  created_at: string;
  assigned_to: string | null;
  assigned_user?: {
    id: string;
    display_name: string | null;
    email: string | null;
  } | null;
  payment_method: string | null;
  items: OrderItem[];
}

export interface TeamMemberOption {
  user_id: string;
  display_name: string;
  email: string;
}
