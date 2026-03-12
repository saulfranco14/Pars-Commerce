import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'
import type { RegisterManualPaymentPayload } from '@/types/loans'
import { sendEmail } from '@/lib/email/sendgrid'
import { loanPaymentConfirmationTemplate } from '@/lib/email/templates'

// GET /api/loan-payments?loan_id=
export async function GET(request: Request) {
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

  const { data: payments, error } = await supabase
    .from('loan_payments')
    .select(`
      id, amount, payment_method, source,
      mp_payment_id, mp_fee_amount, mp_net_amount,
      notes, created_at,
      registered_by_profile:profiles!loan_payments_registered_by_fkey(id, display_name)
    `)
    .eq('loan_id', loanId)
    .order('created_at', { ascending: true })

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json(payments ?? [])
}

// POST /api/loan-payments — Registrar pago manual (efectivo, transferencia, etc.)
export async function POST(request: Request) {
  const supabase = await createClient()
  const { data: { user }, error: authError } = await supabase.auth.getUser()
  if (authError || !user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const body: RegisterManualPaymentPayload = await request.json()
  const { loan_id, amount, payment_method, notes } = body

  if (!loan_id || !amount || !payment_method) {
    return NextResponse.json(
      { error: 'loan_id, amount y payment_method son requeridos' },
      { status: 400 }
    )
  }

  if (amount <= 0) {
    return NextResponse.json({ error: 'El monto debe ser mayor a 0' }, { status: 400 })
  }

  // Obtener el préstamo para validar y para el email
  const { data: loan, error: loanError } = await supabase
    .from('loans')
    .select(`
      id, tenant_id, concept, amount, amount_paid, amount_pending, status,
      customer:customers(id, name, email, mp_customer_id),
      tenant:tenants(name)
    `)
    .eq('id', loan_id)
    .single()

  if (loanError || !loan) {
    return NextResponse.json({ error: 'Préstamo no encontrado' }, { status: 404 })
  }

  if (loan.status === 'paid') {
    return NextResponse.json({ error: 'Este préstamo ya está pagado' }, { status: 400 })
  }

  if (loan.status === 'cancelled') {
    return NextResponse.json({ error: 'Este préstamo está cancelado' }, { status: 400 })
  }

  if (amount > loan.amount_pending) {
    return NextResponse.json(
      { error: `El monto ($${amount}) supera el saldo pendiente ($${loan.amount_pending})` },
      { status: 400 }
    )
  }

  // Insertar pago — el trigger update_loan_on_payment actualiza el loan automáticamente
  const { data: payment, error: insertError } = await supabase
    .from('loan_payments')
    .insert({
      loan_id,
      tenant_id: loan.tenant_id,
      amount,
      payment_method,
      source: 'manual',
      registered_by: user.id,
      notes: notes?.trim() || null,
    })
    .select()
    .single()

  if (insertError) {
    return NextResponse.json({ error: insertError.message }, { status: 500 })
  }

  // Enviar email de confirmación si el cliente tiene email registrado
  const customer = loan.customer as unknown as { id: string; name: string; email: string | null } | null
  const tenant = loan.tenant as unknown as { name: string } | null

  if (customer?.email && tenant?.name) {
    const newAmountPaid = loan.amount_paid + amount
    const newAmountPending = loan.amount_pending - amount
    const isFullyPaid = newAmountPending <= 0

    try {
      await sendEmail({
        to: customer.email,
        subject: `Pago recibido — ${tenant.name}`,
        html: loanPaymentConfirmationTemplate({
          businessName: tenant.name,
          customerName: customer.name,
          amountPaid: amount,
          amountPending: Math.max(0, newAmountPending),
          concept: loan.concept,
          paymentMethod: payment_method,
          isFullyPaid,
        }),
      })
    } catch {
      // El email es best-effort: no falla la operación si el email no se manda
      console.error('[loan-payments] Error enviando email de confirmación')
    }
  }

  return NextResponse.json(payment, { status: 201 })
}
