// =============================================================================
// CUSTOMERS — Tipos para clientes del negocio
// =============================================================================

export type Customer = {
  id: string
  tenant_id: string
  name: string
  email: string | null
  phone: string | null
  notes: string | null
  mp_customer_id: string | null
  created_by: string | null
  created_at: string
  updated_at: string
}

/** Customer con tarjetas guardadas en MP */
export type CustomerWithCards = Customer & {
  cards: CustomerCard[]
}

/** Customer con estadísticas de préstamos (para lista y perfil) */
export type CustomerWithStats = Customer & {
  loans_count: number           // Total de préstamos (todos los estados)
  active_loans_count: number    // pending + partial
  total_amount: number          // Suma de loans.amount (activos)
  total_paid: number            // Suma de loans.amount_paid (activos)
  total_pending: number         // Suma de loans.amount_pending (activos)
  has_overdue: boolean          // ¿Tiene algún préstamo con due_date vencida?
}

export type CustomerCard = {
  id: string
  customer_id: string
  tenant_id: string
  mp_card_id: string
  last_four: string
  card_type: string | null
  holder_name: string | null
  expiration_month: number | null
  expiration_year: number | null
  is_default: boolean
  is_active: boolean
  created_at: string
}

// ── Payloads ──────────────────────────────────────────────────────────────────

export type CreateCustomerPayload = {
  tenant_id: string
  name: string
  email?: string
  phone?: string
  notes?: string
}

export type UpdateCustomerPayload = {
  name?: string
  email?: string | null
  phone?: string | null
  notes?: string | null
}
