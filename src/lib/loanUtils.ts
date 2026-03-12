// =============================================================================
// LOAN UTILS — Cálculo de interés, distribución de pagos bulk, helpers
// =============================================================================

import type { Loan, LoanListItem } from '@/types/loans'
import { MP_FEE_PERCENT, MP_FEE_FIXED_MXN } from '@/constants/commissionConfig'

// ── Interés ───────────────────────────────────────────────────────────────────

/**
 * Calcula el interés acumulado para un préstamo al momento actual.
 *
 * - 'none' / 'fixed': retorna 0 (el monto ya está ajustado en loan.amount)
 * - 'monthly': interest_rate% por cada mes completo transcurrido desde created_at
 * - 'weekly':  interest_rate% por cada semana completa transcurrida desde created_at
 *
 * Se aplica solo sobre el saldo pendiente (amount_pending), no sobre lo ya pagado.
 */
export function calcInterestAccrued(loan: Pick<Loan, 'amount_pending' | 'interest_rate' | 'interest_type' | 'created_at' | 'status'>): number {
  if (loan.status === 'paid' || loan.status === 'cancelled') return 0
  if (loan.interest_type === 'none' || loan.interest_type === 'fixed') return 0
  if (loan.interest_rate === 0) return 0

  const start = new Date(loan.created_at).getTime()
  const now = Date.now()
  const diffMs = now - start

  if (loan.interest_type === 'monthly') {
    const months = Math.floor(diffMs / (1000 * 60 * 60 * 24 * 30))
    return parseFloat((loan.amount_pending * (loan.interest_rate / 100) * months).toFixed(2))
  }

  if (loan.interest_type === 'weekly') {
    const weeks = Math.floor(diffMs / (1000 * 60 * 60 * 24 * 7))
    return parseFloat((loan.amount_pending * (loan.interest_rate / 100) * weeks).toFixed(2))
  }

  return 0
}

/**
 * Retorna el total que debe cobrarle al cliente incluyendo interés acumulado.
 */
export function calcTotalWithInterest(loan: Pick<Loan, 'amount_pending' | 'interest_rate' | 'interest_type' | 'created_at' | 'status'>): number {
  return parseFloat((loan.amount_pending + calcInterestAccrued(loan)).toFixed(2))
}

// ── Días de mora ──────────────────────────────────────────────────────────────

/**
 * Calcula los días de mora de un préstamo.
 * Retorna null si no tiene fecha límite o si ya está pagado/cancelado.
 * Retorna 0 si la fecha no ha vencido.
 * Retorna N > 0 si está vencido hace N días.
 */
export function calcDaysOverdue(loan: Pick<Loan, 'due_date' | 'status'>): number | null {
  if (!loan.due_date) return null
  if (loan.status === 'paid' || loan.status === 'cancelled') return null

  const due = new Date(loan.due_date).getTime()
  const now = Date.now()
  const diffDays = Math.floor((now - due) / (1000 * 60 * 60 * 24))

  return diffDays > 0 ? diffDays : 0
}

/**
 * True si el préstamo está vencido (due_date < hoy y no está pagado).
 */
export function isLoanOverdue(loan: Pick<Loan, 'due_date' | 'status'>): boolean {
  const days = calcDaysOverdue(loan)
  return days !== null && days > 0
}

// ── Cálculo de comisión MP ────────────────────────────────────────────────────

/**
 * Calcula cuánto debe pagar el cliente para que el negocio reciba exactamente `vendorAmount`.
 * Misma lógica que calcBuyerTotal() en commissionConfig.ts pero expresada aquí también
 * para uso en préstamos sin depender del contexto de órdenes.
 */
export function calcLoanBuyerTotal(vendorAmount: number): {
  buyerTotal: number
  mpFee: number
  vendorReceives: number
} {
  const mpFee = parseFloat(((vendorAmount * MP_FEE_PERCENT) / 100 + MP_FEE_FIXED_MXN).toFixed(2))
  const buyerTotal = parseFloat((vendorAmount + mpFee).toFixed(2))
  return { buyerTotal, mpFee, vendorReceives: vendorAmount }
}

/**
 * Si el negocio absorbe la comisión, el cliente paga el monto base y el negocio
 * recibe menos (vendorAmount - mpFee).
 */
export function calcLoanBusinessAbsorbsFee(amount: number): {
  buyerTotal: number
  mpFee: number
  vendorReceives: number
} {
  const mpFee = parseFloat(((amount * MP_FEE_PERCENT) / 100 + MP_FEE_FIXED_MXN).toFixed(2))
  const vendorReceives = parseFloat((amount - mpFee).toFixed(2))
  return { buyerTotal: amount, mpFee, vendorReceives }
}

// ── Distribución de pago bulk ─────────────────────────────────────────────────

/**
 * Dado un array de loans con sus montos a cobrar, construye:
 * - El total del pago bulk
 * - El objeto distribution { loanId: amount } para guardar en BD
 * - Los items para la preference de MP
 */
export function buildBulkPaymentDistribution(
  loans: Array<{ loan_id: string; concept: string; amount: number }>
): {
  totalAmount: number
  distribution: Record<string, number>
  items: Array<{ id: string; title: string; quantity: number; unit_price: number; currency_id: string }>
} {
  const distribution: Record<string, number> = {}
  let totalAmount = 0

  const items = loans.map((l) => {
    distribution[l.loan_id] = l.amount
    totalAmount += l.amount
    return {
      id: l.loan_id,
      title: l.concept,
      quantity: 1,
      unit_price: l.amount,
      currency_id: 'MXN',
    }
  })

  return {
    totalAmount: parseFloat(totalAmount.toFixed(2)),
    distribution,
    items,
  }
}

// ── Enriquecer LoanListItem ───────────────────────────────────────────────────

/**
 * Agrega campos calculados a un Loan para convertirlo en LoanListItem.
 * customer debe ser pasado externamente (viene del JOIN con customers).
 */
export function enrichLoan(
  loan: Loan,
  customer: LoanListItem['customer']
): LoanListItem {
  const interest_accrued = calcInterestAccrued(loan)
  const total_with_interest = parseFloat((loan.amount_pending + interest_accrued).toFixed(2))
  const days_overdue = calcDaysOverdue(loan)

  return {
    ...loan,
    customer,
    interest_accrued,
    total_with_interest,
    days_overdue,
  }
}

// ── Helpers de formato ────────────────────────────────────────────────────────

/** Formatea un monto en pesos mexicanos */
export function formatMXN(amount: number): string {
  return new Intl.NumberFormat('es-MX', {
    style: 'currency',
    currency: 'MXN',
    minimumFractionDigits: 2,
  }).format(amount)
}

/** Etiqueta legible para el estado del préstamo */
export const LOAN_STATUS_LABEL: Record<Loan['status'], string> = {
  pending:   'Pendiente',
  partial:   'Parcial',
  paid:      'Pagado',
  cancelled: 'Cancelado',
}

/** Etiqueta legible para el estado del plan automático */
export const PAYMENT_PLAN_STATUS_LABEL: Record<string, string> = {
  pending_setup: 'Esperando tarjeta',
  active:        'Activo',
  paused:        'Pausado',
  card_failed:   'Tarjeta fallida',
  completed:     'Completado',
  cancelled:     'Cancelado',
}

/** Etiqueta legible para el método de pago */
export const LOAN_PAYMENT_METHOD_LABEL: Record<string, string> = {
  efectivo:      'Efectivo',
  transferencia: 'Transferencia',
  tarjeta:       'Tarjeta',
  mercadopago:   'MercadoPago',
  otro:          'Otro',
}
