// =============================================================================
// SUBSCRIPTIONS — Tipos para compras recurrentes y en cuotas (storefront)
// =============================================================================

// -- Enums / Unions -----------------------------------------------------------

export type SubscriptionType = 'installments' | 'recurring'

export type SubscriptionStatus =
  | 'pending_setup'
  | 'active'
  | 'paused'
  | 'card_failed'
  | 'completed'
  | 'cancelled'

export type SubscriptionFeeAbsorbedBy = 'customer' | 'business'

export type SubscriptionPaymentStatus = 'paid' | 'failed' | 'refunded'

// -- Snapshot de items del carrito ---------------------------------------------

export type SubscriptionItemSnapshot = {
  product_id: string
  name: string
  quantity: number
  unit_price: number
  image_url: string | null
  promotion_id?: string | null
}

// -- Modelo principal ---------------------------------------------------------

export type Subscription = {
  id: string
  tenant_id: string

  customer_id: string | null
  customer_name: string
  customer_email: string
  customer_phone: string | null

  type: SubscriptionType
  frequency: number
  frequency_type: 'weeks' | 'months'

  original_amount: number
  discount_percent: number
  discounted_amount: number
  installment_amount: number
  charge_amount: number
  service_fee_per_charge: number

  total_installments: number | null
  completed_installments: number

  status: SubscriptionStatus

  mp_preapproval_id: string | null
  mp_subscription_init_point: string | null
  mp_fee_absorbed_by: SubscriptionFeeAbsorbedBy

  original_order_id: string | null
  concept: string | null
  items_snapshot: SubscriptionItemSnapshot[]

  start_date: string | null
  next_charge_date: string | null
  cancelled_at: string | null
  created_at: string
  updated_at: string
}

/** Subscription con datos de cliente para listas en dashboard */
export type SubscriptionListItem = Subscription & {
  customer?: {
    id: string
    name: string
    phone: string | null
    email: string | null
  } | null
}

// -- Pagos de suscripcion -----------------------------------------------------

export type SubscriptionPayment = {
  id: string
  subscription_id: string
  tenant_id: string

  installment_number: number
  amount: number
  service_fee: number
  net_amount: number | null

  order_id: string | null

  mp_payment_id: string | null
  mp_preapproval_id: string | null

  status: SubscriptionPaymentStatus
  created_at: string
}

// -- Payloads -----------------------------------------------------------------

export type CreateSubscriptionCheckoutPayload = {
  tenant_id: string
  cart_id: string
  customer_name: string
  customer_email: string
  customer_phone?: string
  payment_mode: 'installments' | 'recurring'
  installments?: number
  frequency: number
  frequency_type: 'weeks' | 'months'
}

export type SubscriptionCheckoutResponse = {
  subscription_id: string
  order_id: string
  init_point: string
  redirect_url: string
}

// -- Configuracion del tenant -------------------------------------------------

export type RecurringPurchasesConfig = {
  installments_enabled: boolean
  recurring_enabled: boolean
  fee_absorbed_by: SubscriptionFeeAbsorbedBy
  subscription_discount_percent: number
  delivery_on: 'first_payment' | 'full_payment'
  allowed_frequencies: Array<'weekly' | 'biweekly' | 'monthly'>
  max_installments: number
}

export const DEFAULT_RECURRING_CONFIG: RecurringPurchasesConfig = {
  installments_enabled: false,
  recurring_enabled: false,
  fee_absorbed_by: 'customer',
  subscription_discount_percent: 0,
  delivery_on: 'first_payment',
  allowed_frequencies: ['weekly', 'biweekly', 'monthly'],
  max_installments: 6,
}
