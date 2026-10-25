import { MsiOption } from "@/constants/commissionConfig";
import type {
  CheckoutDeliveryAddress,
  CheckoutFulfillmentMethod,
  CheckoutPaymentMethod,
} from "@/features/checkout/interfaces/publicCheckout";

export interface PublicCartItem {
  id: string;
  product_id: string;
  product_variant_id?: string | null;
  quantity: number;
  price_snapshot: number;
  list_unit_price?: number | null;
  promotion_id?: string | null;
  /** Lines that share it belong to one pack or NxM and change together. */
  group_id?: string | null;
  group_unit_quantity?: number | null;
  promotion?: { id: string; name: string; type: string } | null;
  product?: {
    id: string;
    name: string;
    slug: string | null;
    image_url: string | null;
  };
  variant?: {
    id: string;
    selection_key: string;
    image_url: string | null;
  } | null;
}

/** A subscription in the cart: today pays its first period, then it repeats. */
export interface CartPlanLine {
  id: string;
  offer_plan_id: string;
  billing_method: "manual" | "mp_auto";
  price_snapshot: number;
  plan: {
    id: string;
    kind: "subscription" | "membership";
    status: string;
    name: string;
    slug: string;
    image_url: string | null;
    interval_unit: "week" | "month";
    interval_count: number;
    max_periods: number | null;
    fulfillment_methods: Array<"pickup" | "delivery" | "in_store">;
    preferred_weekday: number | null;
    items_count: number;
  };
}

export interface PublicCartResponse {
  cart: { id: string; tenant_id: string } | null;
  items: PublicCartItem[];
  /** Product lines only; plans are added on top as `plans_total`. */
  subtotal: number;
  items_count: number;
  plans?: CartPlanLine[];
  plans_total?: number;
}

export interface CheckoutPickupPayload {
  tenant_id: string;
  cart_id: string;
  customer_name: string;
  customer_email: string;
  customer_phone: string;
  msi_option?: MsiOption;
  /** ISO de la hora de recolección. `null` = pasa cuando esté listo. */
  scheduled_for?: string | null;
  accept_terms?: boolean;
  marketing_opt_in?: boolean;
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
  msi_option?: MsiOption;
  /** ISO de la hora de recolección. `null` = pasa cuando esté listo. */
  scheduled_for?: string | null;
  fulfillment_method?: CheckoutFulfillmentMethod;
  payment_method?: CheckoutPaymentMethod;
  pickup_point_id?: string;
  delivery?: CheckoutDeliveryAddress;
  accept_terms?: boolean;
  accept_recurring_mandate?: boolean;
  marketing_opt_in?: boolean;
}

export interface CheckoutSubscriptionResponse {
  subscription_id: string;
  order_id: string;
  init_point: string;
  redirect_url: string;
}
