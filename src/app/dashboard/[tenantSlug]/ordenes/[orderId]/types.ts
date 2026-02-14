export interface OrderItem {
  id: string;
  quantity: number;
  unit_price: number;
  subtotal: number;
  is_wholesale?: boolean;
  wholesale_savings?: number;
  product: { id: string; name: string; type: string; image_url?: string | null } | null;
}

export interface OrderDetail {
  id: string;
  status: string;
  cancelled_from?: string | null;
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
  payment_link?: string | null;
  mp_preference_id?: string | null;
  items: OrderItem[];
}

export interface TeamMemberOption {
  user_id: string;
  display_name: string;
  email: string;
}
