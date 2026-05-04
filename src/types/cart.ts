export interface PublicCartItem {
  id: string;
  product_id: string;
  quantity: number;
  price_snapshot: number;
  promotion_id?: string | null;
  product?: {
    id: string;
    name: string;
    slug: string | null;
    image_url: string | null;
  };
}

export interface PublicCartResponse {
  cart: { id: string; tenant_id: string } | null;
  items: PublicCartItem[];
  subtotal: number;
  items_count: number;
}

export interface CheckoutPickupPayload {
  tenant_id: string;
  cart_id: string;
  customer_name: string;
  customer_email: string;
  customer_phone: string;
}

export interface CheckoutPickupResponse {
  success: boolean;
  order_id: string;
  redirect_url: string;
}

export interface CheckoutSubscriptionPayload {
  tenant_id: string;
  cart_id: string;
  customer_name: string;
  customer_email: string;
  customer_phone: string;
  payment_mode: "installments" | "recurring";
  installments?: number;
  frequency: number;
  frequency_type: "weeks" | "months";
}

export interface CheckoutSubscriptionResponse {
  subscription_id: string;
  order_id: string;
  init_point: string;
  redirect_url: string;
}
