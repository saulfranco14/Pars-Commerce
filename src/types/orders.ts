export interface OrderListItem {
  id: string;
  status: string;
  cancelled_from?: string | null;
  source?: "dashboard" | "public_store" | null;
  customer_name: string | null;
  customer_email: string | null;
  total: number;
  created_at: string;
  paid_at: string | null;
  assigned_to: string | null;
  payment_method?: string | null;
  assigned_user?: {
    id: string;
    display_name: string | null;
    email: string | null;
  } | null;
  products_count?: number;
  services_count?: number;
}

export interface CreateOrderPayload {
  tenant_id: string;
  customer_name?: string;
  customer_email?: string;
  customer_phone?: string;
  assigned_to?: string;
}

export interface UpdateOrderPayload {
  status?: string;
  assigned_to?: string | null;
  payment_method?: string | null;
  customer_name?: string | null;
  customer_email?: string | null;
  customer_phone?: string | null;
  discount?: number;
}
