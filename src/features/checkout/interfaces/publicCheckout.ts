import type { MsiOption } from "@/constants/commissionConfig";

export type CheckoutMode = "single" | "subscription" | "partial";
export type CheckoutPaymentMethod = "mercadopago" | "bank_transfer" | "cash";
export type CheckoutFulfillmentMethod = "delivery" | "pickup";

export interface CheckoutDeliveryAddress {
  recipient_name: string;
  phone: string;
  address_text: string;
  reference?: string;
  latitude?: number | null;
  longitude?: number | null;
  mapbox_feature_id?: string;
}

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
  msi_option?: MsiOption;
  /**
   * Cuándo pasa el cliente por su pedido, en ISO. Opcional: sin valor, lo
   * recoge cuando esté listo. NO es entrega a domicilio.
   */
  scheduled_for?: string | null;
  /** Delivery and payment are deliberately separate decisions. */
  fulfillment_method?: CheckoutFulfillmentMethod;
  pickup_point_id?: string;
  delivery?: CheckoutDeliveryAddress;
  payment_method?: CheckoutPaymentMethod;
  accept_terms?: boolean;
  accept_recurring_mandate?: boolean;
  marketing_opt_in?: boolean;
}

export interface PublicCheckoutResponse {
  success: boolean;
  checkout_mode: CheckoutMode;
  status: "redirect" | "pending" | "failed";
  order_id: string;
  subscription_id?: string;
  payment_link?: string;
  redirect_url?: string;
  next_action: "open_payment_link" | "retry_or_change_mode" | "open_tracking";
  tracking_url?: string;
}
