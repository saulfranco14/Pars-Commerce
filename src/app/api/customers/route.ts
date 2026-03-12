import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'
import type { CreateCustomerPayload, UpdateCustomerPayload } from '@/types/customers'

// GET /api/customers?tenant_id=&search=&customer_id=
export async function GET(request: Request) {
  const supabase = await createClient()
  const { data: { user }, error: authError } = await supabase.auth.getUser()
  if (authError || !user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { searchParams } = new URL(request.url)
  const tenantId = searchParams.get('tenant_id')
  const customerId = searchParams.get('customer_id')
  const search = searchParams.get('search')?.trim()
  const withStats = searchParams.get('with_stats') === 'true'

  // Obtener un cliente específico con sus tarjetas y stats de préstamos
  if (customerId) {
    const { data: customer, error } = await supabase
      .from('customers')
      .select(`
        *,
        cards:customer_cards(id, mp_card_id, last_four, card_type, holder_name, expiration_month, expiration_year, is_default, is_active, created_at)
      `)
      .eq('id', customerId)
      .single()

    if (error || !customer) {
      return NextResponse.json({ error: error?.message ?? 'Customer not found' }, { status: 404 })
    }
    return NextResponse.json(customer)
  }

  if (!tenantId) {
    return NextResponse.json({ error: 'tenant_id or customer_id is required' }, { status: 400 })
  }

  // Listado de clientes con búsqueda y stats opcionales
  let query = supabase
    .from('customers')
    .select(
      withStats
        ? `
          *,
          loans!inner(
            id, amount, amount_paid, amount_pending, status, due_date
          )
        `
        : '*'
    )
    .eq('tenant_id', tenantId)
    .order('name', { ascending: true })

  // Búsqueda por nombre o teléfono (para autocomplete al crear préstamo)
  if (search) {
    query = query.or(`name.ilike.%${search}%,phone.ilike.%${search}%,email.ilike.%${search}%`)
  }

  const { data: customers, error } = await query

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json(customers ?? [])
}

// POST /api/customers
export async function POST(request: Request) {
  const supabase = await createClient()
  const { data: { user }, error: authError } = await supabase.auth.getUser()
  if (authError || !user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const body: CreateCustomerPayload = await request.json()
  const { tenant_id, name, email, phone, notes } = body

  if (!tenant_id || !name?.trim() || !phone?.trim() || !email?.trim()) {
    return NextResponse.json({ error: 'tenant_id, name, phone y email son requeridos' }, { status: 400 })
  }

  // Verificar que el usuario pertenece al tenant
  const { data: membership } = await supabase
    .from('tenant_memberships')
    .select('id')
    .eq('tenant_id', tenant_id)
    .eq('user_id', user.id)
    .single()

  if (!membership) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  const { data: customer, error } = await supabase
    .from('customers')
    .insert({
      tenant_id,
      name: name.trim(),
      email: email?.trim() || null,
      phone: phone?.trim() || null,
      notes: notes?.trim() || null,
      created_by: user.id,
    })
    .select()
    .single()

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json(customer, { status: 201 })
}

// PUT /api/customers?customer_id=
export async function PUT(request: Request) {
  const supabase = await createClient()
  const { data: { user }, error: authError } = await supabase.auth.getUser()
  if (authError || !user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { searchParams } = new URL(request.url)
  const customerId = searchParams.get('customer_id')
  if (!customerId) {
    return NextResponse.json({ error: 'customer_id es requerido' }, { status: 400 })
  }

  const body: UpdateCustomerPayload = await request.json()
  const updates: Record<string, unknown> = { updated_at: new Date().toISOString() }

  if (body.name !== undefined) updates.name = body.name.trim()
  if (body.email !== undefined) updates.email = body.email?.trim() || null
  if (body.phone !== undefined) updates.phone = body.phone?.trim() || null
  if (body.notes !== undefined) updates.notes = body.notes?.trim() || null

  const { data: customer, error } = await supabase
    .from('customers')
    .update(updates)
    .eq('id', customerId)
    .select()
    .single()

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json(customer)
}
