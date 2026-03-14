// =============================================================================
// LOANS — Tipos para el módulo de préstamos/fiados
// =============================================================================

import type { Customer } from './customers'

// ── Enums / Unions ────────────────────────────────────────────────────────────

export type LoanStatus = 'pending' | 'partial' | 'paid' | 'cancelled'

export type LoanPaymentMethod =
  | 'efectivo'
  | 'transferencia'
  | 'tarjeta'
  | 'mercadopago'
  | 'otro'

export type LoanPaymentSource =
  | 'manual'
  | 'mercadopago_webhook'
  | 'preapproval_webhook'

export type InterestType = 'none' | 'fixed' | 'monthly' | 'weekly'

export type PaymentPlanType = 'single' | 'installments' | 'recurring'

export type PaymentPlanStatus =
  | 'pending_setup'   // Esperando que el cliente guarde su tarjeta
  | 'active'          // Cobrando automáticamente
  | 'paused'          // Suscripción pausada en MP
  | 'card_failed'     // Todos los reintentos de MP fallaron
  | 'completed'       // Todos los cobros del plan se completaron
  | 'cancelled'       // Suscripción cancelada

export type MpFeeAbsorbedBy = 'customer' | 'business'

export type BulkPaymentStatus = 'pending' | 'paid' | 'failed' | 'expired'

// ── Modelos principales ───────────────────────────────────────────────────────

export type Loan = {
  id: string
  tenant_id: string
  customer_id: string

  amount: number
  amount_paid: number
  amount_pending: number          // GENERATED en BD: amount - amount_paid

  interest_rate: number           // 0 si no hay interés
  interest_type: InterestType

  concept: string
  due_date: string | null
  notes: string | null
  order_id: string | null

  status: LoanStatus

  // Plan de cobro automático (null si no hay plan)
  payment_plan_type: PaymentPlanType | null
  payment_plan_frequency: number | null
  payment_plan_frequency_type: 'weeks' | 'months' | null
  payment_plan_installment_amount: number | null
  payment_plan_status: PaymentPlanStatus | null

  // Integración MP — Suscripción
  mp_preapproval_id: string | null
  mp_preapproval_plan_id: string | null
  mp_subscription_init_point: string | null

  // Integración MP — Link único
  last_payment_link: string | null
  last_mp_preference_id: string | null

  mp_fee_absorbed_by: MpFeeAbsorbedBy

  created_by: string | null
  cancelled_by: string | null
  cancelled_at: string | null
  paid_at: string | null
  created_at: string
  updated_at: string
}

/** Loan con datos de cliente y campos calculados (para listas y detalle) */
export type LoanListItem = Loan & {
  customer: Pick<Customer, 'id' | 'name' | 'phone' | 'email'>
  days_overdue: number | null       // null si no tiene due_date o no está vencido
  interest_accrued: number          // Interés acumulado calculado en el cliente
  total_with_interest: number       // amount_pending + interest_accrued
}

export type LoanPayment = {
  id: string
  loan_id: string
  tenant_id: string
  amount: number
  payment_method: LoanPaymentMethod
  source: LoanPaymentSource
  mp_payment_id: string | null
  mp_preference_id: string | null
  mp_preapproval_id: string | null
  mp_fee_amount: number | null
  mp_net_amount: number | null
  registered_by: string | null
  notes: string | null
  created_at: string
}

export type LoanBulkPayment = {
  id: string
  tenant_id: string
  customer_id: string
  mp_preference_id: string
  mp_payment_id: string | null
  total_amount: number
  status: BulkPaymentStatus
  loan_ids: string[]
  distribution: Record<string, number>  // { loanId: amount }
  created_by: string | null
  created_at: string
}

// ── Payloads de creación / actualización ─────────────────────────────────────

export type CreateLoanPayload = {
  tenant_id: string
  customer_id: string
  amount: number
  concept: string
  due_date?: string
  notes?: string
  order_id?: string
  interest_rate?: number
  interest_type?: InterestType
  mp_fee_absorbed_by?: MpFeeAbsorbedBy
  // Plan de cobro automático (opcional)
  payment_plan_type?: PaymentPlanType
  payment_plan_frequency?: number
  payment_plan_frequency_type?: 'weeks' | 'months'
  payment_plan_installment_amount?: number
}

export type UpdateLoanPayload = {
  concept?: string
  due_date?: string | null
  notes?: string | null
  status?: 'cancelled'                  // Solo se puede cancelar manualmente
  mp_fee_absorbed_by?: MpFeeAbsorbedBy
  payment_plan_status?: PaymentPlanStatus
  mp_preapproval_id?: string | null
  mp_preapproval_plan_id?: string | null
  mp_subscription_init_point?: string | null
  last_payment_link?: string | null
  last_mp_preference_id?: string | null
}

export type RegisterManualPaymentPayload = {
  loan_id: string
  amount: number
  payment_method: Exclude<LoanPaymentMethod, 'mercadopago'>
  notes?: string
}

export type CreateLoanPreferencePayload = {
  loan_id: string
  amount: number                        // Puede ser monto parcial
  mp_fee_absorbed_by: MpFeeAbsorbedBy
}

export type CreateBulkLoanPreferencePayload = {
  tenant_id: string
  customer_id: string
  // Mapa de qué monto se cobra por cada loan (puede ser parcial por loan)
  loans: Array<{
    loan_id: string
    amount: number
  }>
  mp_fee_absorbed_by: MpFeeAbsorbedBy
}

export type CreateLoanSubscriptionPayload = {
  loan_id: string
  // Si no se especifica, se usa payment_plan_installment_amount del loan
  installment_amount?: number
  start_date: string                    // ISO 8601
  end_date?: string                     // ISO 8601, opcional
}

// ── Respuestas de API ─────────────────────────────────────────────────────────

export type LoanPreferenceResponse = {
  payment_link: string
  preference_id: string
  buyer_total: number           // Lo que paga el cliente (incluye comisión si customer absorbe)
  mp_fee: number
  vendor_amount: number         // Lo que recibe el negocio
}

export type LoanSubscriptionResponse = {
  preapproval_id: string
  init_point: string            // URL que el cliente debe abrir para guardar tarjeta
  status: 'pending_setup'
}

// ── Stats para dashboard ──────────────────────────────────────────────────────

export type LoanDashboardStats = {
  total_pending_amount: number        // Suma de amount_pending de loans activos
  active_loans_count: number          // Loans en pending + partial
  overdue_loans_count: number         // Loans con due_date vencida
  customers_with_debt: number         // Clientes únicos con saldo pendiente
}
