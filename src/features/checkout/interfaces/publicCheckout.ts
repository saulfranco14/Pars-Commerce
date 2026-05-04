export type CheckoutMode = "single" | "subscription" | "partial";

export interface PublicCheckoutPayload {
  tenant_id: string;
  cart_id: string;
  customer_name: string;
  customer_email: string;
  customer_phone?: string;
  mode: CheckoutMode;
  installments?: number;
  frequency?: number;
  frequency_type?: "weeks" | "months";
}

export interface PublicCheckoutResponse {
  success: boolean;
  checkout_mode: CheckoutMode;
  status: "redirect" | "pending" | "failed";
  order_id: string;
  subscription_id?: string;
  payment_link?: string;
  redirect_url?: string;
  next_action: "open_payment_link" | "retry_or_change_mode";
}

