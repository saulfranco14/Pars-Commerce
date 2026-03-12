import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'
import type { CreateLoanPayload, UpdateLoanPayload } from '@/types/loans'

// GET /api/loans?tenant_id=&loan_id=&customer_id=&status=&overdue=true
export async function GET(request: Request) {
  const supabase = await createClient()
  const { data: { user }, error: authError } = await supabase.auth.getUser()
  if (authError || !user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { searchParams } = new URL(request.url)
  const tenantId = searchParams.get('tenant_id')
  const loanId = searchParams.get('loan_id')
  const customerId = searchParams.get('customer_id')
  const status = searchParams.get('status')         // pending | partial | paid | cancelled | active
  const overdueOnly = searchParams.get('overdue') === 'true'

  // Detalle de un préstamo con historial de pagos y datos del cliente
  if (loanId) {
    const { data: loan, error } = await supabase
      .from('loans')
      .select(`
        *,
        customer:customers(id, name, email, phone, mp_customer_id,
          cards:customer_cards(id, last_four, card_type, holder_name, is_default, is_active)
        ),
        payments:loan_payments(
          id, amount, payment_method, source,
          mp_payment_id, mp_fee_amount, mp_net_amount,
          registered_by, notes, created_at,
          registered_by_profile:profiles!loan_payments_registered_by_fkey(id, display_name)
        ),
        order:orders(id, status, total, created_at)
      `)
      .eq('id', loanId)
      .order('created_at', { referencedTable: 'loan_payments', ascending: true })
      .single()

    if (error || !loan) {
      return NextResponse.json({ error: error?.message ?? 'Loan not found' }, { status: 404 })
    }
    return NextResponse.json(loan)
  }

  if (!tenantId) {
    return NextResponse.json({ error: 'tenant_id o loan_id es requerido' }, { status: 400 })
  }

  let query = supabase
    .from('loans')
    .select(`
      id, concept, amount, amount_paid, amount_pending, status,
      interest_rate, interest_type, due_date,
      payment_plan_type, payment_plan_status,
      mp_subscription_init_point, last_payment_link,
      created_at, updated_at, paid_at,
      customer:customers(id, name, email, phone)
    `)
    .eq('tenant_id', tenantId)
    .order('created_at', { ascending: false })

  // Filtro por cliente
  if (customerId) {
    query = query.eq('customer_id', customerId)
  }

  // Filtro por estado: 'active' = pending + partial juntos
  if (status === 'active') {
    query = query.in('status', ['pending', 'partial'])
  } else if (status) {
    query = query.eq('status', status)
  }

  // Solo vencidos: due_date < hoy y no pagados/cancelados
  if (overdueOnly) {
    const today = new Date().toISOString().split('T')[0]
    query = query.lt('due_date', today).not('status', 'in', '("paid","cancelled")')
  }

  const { data: loans, error } = await query

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json(loans ?? [])
}

// POST /api/loans
export async function POST(request: Request) {
  const supabase = await createClient()
  const { data: { user }, error: authError } = await supabase.auth.getUser()
  if (authError || !user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const body: CreateLoanPayload = await request.json()
  const {
    tenant_id,
    customer_id,
    amount,
    concept,
    due_date,
    notes,
    order_id,
    interest_rate = 0,
    interest_type = 'none',
    mp_fee_absorbed_by = 'customer',
    payment_plan_type,
    payment_plan_frequency,
    payment_plan_frequency_type,
    payment_plan_installment_amount,
  } = body

  if (!tenant_id || !customer_id || !amount || !concept?.trim()) {
    return NextResponse.json(
      { error: 'tenant_id, customer_id, amount y concept son requeridos' },
      { status: 400 }
    )
  }

  if (amount <= 0) {
    return NextResponse.json({ error: 'El monto debe ser mayor a 0' }, { status: 400 })
  }

  // Verificar membresía del usuario en el tenant
  const { data: membership } = await supabase
    .from('tenant_memberships')
    .select('id')
    .eq('tenant_id', tenant_id)
    .eq('user_id', user.id)
    .single()

  if (!membership) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  // Verificar que el cliente pertenece al tenant
  const { data: customer } = await supabase
    .from('customers')
    .select('id')
    .eq('id', customer_id)
    .eq('tenant_id', tenant_id)
    .single()

  if (!customer) {
    return NextResponse.json({ error: 'Cliente no encontrado en este negocio' }, { status: 404 })
  }

  const insertData: Record<string, unknown> = {
    tenant_id,
    customer_id,
    amount,
    concept: concept.trim(),
    interest_rate,
    interest_type,
    mp_fee_absorbed_by,
    created_by: user.id,
  }

  if (due_date) insertData.due_date = due_date
  if (notes) insertData.notes = notes.trim()
  if (order_id) insertData.order_id = order_id
  if (payment_plan_type) {
    insertData.payment_plan_type = payment_plan_type
    insertData.payment_plan_frequency = payment_plan_frequency
    insertData.payment_plan_frequency_type = payment_plan_frequency_type
    insertData.payment_plan_installment_amount = payment_plan_installment_amount
    insertData.payment_plan_status = 'pending_setup'
  }

  const { data: loan, error } = await supabase
    .from('loans')
    .insert(insertData)
    .select(`
      *,
      customer:customers(id, name, email, phone)
    `)
    .single()

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  // Si viene de una orden, vincular la orden al customer
  if (order_id) {
    await supabase
      .from('orders')
      .update({ customer_id })
      .eq('id', order_id)
      .is('customer_id', null)   // Solo si no tenía customer vinculado
  }

  return NextResponse.json(loan, { status: 201 })
}

// PUT /api/loans?loan_id=
export async function PUT(request: Request) {
  const supabase = await createClient()
  const { data: { user }, error: authError } = await supabase.auth.getUser()
  if (authError || !user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { searchParams } = new URL(request.url)
  const loanId = searchParams.get('loan_id')
  if (!loanId) {
    return NextResponse.json({ error: 'loan_id es requerido' }, { status: 400 })
  }

  const body: UpdateLoanPayload = await request.json()
  const updates: Record<string, unknown> = { updated_at: new Date().toISOString() }

  if (body.concept !== undefined) updates.concept = body.concept.trim()
  if (body.due_date !== undefined) updates.due_date = body.due_date
  if (body.notes !== undefined) updates.notes = body.notes?.trim() || null
  if (body.mp_fee_absorbed_by !== undefined) updates.mp_fee_absorbed_by = body.mp_fee_absorbed_by
  if (body.payment_plan_status !== undefined) updates.payment_plan_status = body.payment_plan_status
  if (body.mp_preapproval_id !== undefined) updates.mp_preapproval_id = body.mp_preapproval_id
  if (body.mp_preapproval_plan_id !== undefined) updates.mp_preapproval_plan_id = body.mp_preapproval_plan_id
  if (body.mp_subscription_init_point !== undefined) updates.mp_subscription_init_point = body.mp_subscription_init_point
  if (body.last_payment_link !== undefined) updates.last_payment_link = body.last_payment_link
  if (body.last_mp_preference_id !== undefined) updates.last_mp_preference_id = body.last_mp_preference_id

  // Cancelación: requiere que no esté ya pagado
  if (body.status === 'cancelled') {
    const { data: existing } = await supabase
      .from('loans')
      .select('status')
      .eq('id', loanId)
      .single()

    if (existing?.status === 'paid') {
      return NextResponse.json({ error: 'No se puede cancelar un préstamo ya pagado' }, { status: 400 })
    }
    updates.status = 'cancelled'
    updates.cancelled_by = user.id
    updates.cancelled_at = new Date().toISOString()
  }

  const { data: loan, error } = await supabase
    .from('loans')
    .update(updates)
    .eq('id', loanId)
    .select(`
      *,
      customer:customers(id, name, email, phone)
    `)
    .single()

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json(loan)
}
