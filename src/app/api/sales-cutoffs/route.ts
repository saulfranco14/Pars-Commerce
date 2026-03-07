import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { NextResponse } from "next/server";

const PAYMENT_METHODS = ["efectivo", "transferencia", "tarjeta", "mercadopago"];

async function isAdminOrOwner(
  userId: string,
  tenantId: string
): Promise<boolean> {
  const admin = createAdminClient();
  const { data: membership } = await admin
    .from("tenant_memberships")
    .select("role:tenant_roles(name, permissions)")
    .eq("user_id", userId)
    .eq("tenant_id", tenantId)
    .single();

  const rawRole = membership?.role as
    | { name: string; permissions: string[] }
    | { name: string; permissions: string[] }[]
    | null
    | undefined;
  const role = Array.isArray(rawRole) ? rawRole[0] : rawRole;
  return !!(role && (role.name === "owner" || role.name === "admin"));
}

export async function GET(request: Request) {
  const supabase = await createClient();
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const tenantId = searchParams.get("tenant_id");

  if (!tenantId) {
    return NextResponse.json(
      { error: "tenant_id is required" },
      { status: 400 }
    );
  }

  const { data: cutoffs, error } = await supabase
    .from("sales_cutoffs")
    .select(
      `
      id,
      tenant_id,
      period_start,
      period_end,
      total_orders,
      total_revenue,
      total_cost,
      gross_profit,
      commissions_pending,
      commissions_paid,
      breakdown_by_person,
      breakdown_by_payment_method,
      notes,
      created_at,
      created_by_profile:profiles!sales_cutoffs_created_by_fkey(id, display_name, email)
      `
    )
    .eq("tenant_id", tenantId)
    .order("period_end", { ascending: false });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json(cutoffs ?? []);
}

export async function POST(request: Request) {
  const supabase = await createClient();
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await request.json();
  const { tenant_id, notes } = body as { tenant_id: string; notes?: string };

  if (!tenant_id) {
    return NextResponse.json(
      { error: "tenant_id is required" },
      { status: 400 }
    );
  }

  // Only owner or admin can generate a cutoff
  const canGenerate = await isAdminOrOwner(user.id, tenant_id);
  if (!canGenerate) {
    return NextResponse.json(
      { error: "Solo el admin o propietario puede generar cortes de caja" },
      { status: 403 }
    );
  }

  const now = new Date().toISOString();

  // Determine period_start: use period_end of the last cutoff, or tenant created_at
  const { data: lastCutoff } = await supabase
    .from("sales_cutoffs")
    .select("period_end")
    .eq("tenant_id", tenant_id)
    .order("period_end", { ascending: false })
    .limit(1)
    .single();

  let periodStart: string;
  if (lastCutoff?.period_end) {
    periodStart = lastCutoff.period_end;
  } else {
    // No previous cutoffs: use the tenant's created_at
    const { data: tenant } = await supabase
      .from("tenants")
      .select("created_at")
      .eq("id", tenant_id)
      .single();
    periodStart = tenant?.created_at ?? now;
  }

  // Fetch all paid orders in the period
  const { data: orders, error: ordersError } = await supabase
    .from("orders")
    .select("id, total, payment_method")
    .eq("tenant_id", tenant_id)
    .eq("status", "paid")
    .gte("paid_at", periodStart)
    .lte("paid_at", now);

  if (ordersError) {
    return NextResponse.json({ error: ordersError.message }, { status: 500 });
  }

  const paidOrders = orders ?? [];
  const orderIds = paidOrders.map((o) => o.id);

  let totalRevenue = 0;
  let totalCost = 0;
  const byPaymentMethod: Record<string, number> = {
    efectivo: 0,
    transferencia: 0,
    tarjeta: 0,
    mercadopago: 0,
    other: 0,
  };

  for (const o of paidOrders) {
    const total = Number(o.total) || 0;
    totalRevenue += total;
    const method = (o.payment_method || "").toLowerCase().trim();
    if (PAYMENT_METHODS.includes(method)) {
      byPaymentMethod[method] += total;
    } else {
      byPaymentMethod.other += total;
    }
  }

  // Calculate total cost from order items
  if (orderIds.length > 0) {
    const { data: items } = await supabase
      .from("order_items")
      .select("quantity, product:products(cost_price)")
      .in("order_id", orderIds);

    for (const it of items ?? []) {
      const item = it as {
        quantity: number;
        product:
          | { cost_price: number }
          | { cost_price: number }[]
          | null;
      };
      const prod = Array.isArray(item.product) ? item.product[0] : item.product;
      const costPrice = Number(prod?.cost_price ?? 0) || 0;
      totalCost += costPrice * (Number(item.quantity) || 0);
    }
  }

  // Build breakdown by person from sales_commissions in this period
  const { data: commissions } = await supabase
    .from("sales_commissions")
    .select(
      `
      user_id,
      total_revenue,
      commission_amount,
      is_paid,
      profiles!sales_commissions_user_id_fkey(id, display_name, email)
      `
    )
    .eq("tenant_id", tenant_id)
    .is("voided_at", null)
    .gte("created_at", periodStart)
    .lte("created_at", now);

  const personMap = new Map<
    string,
    {
      display_name: string | null;
      email: string | null;
      total_revenue: number;
      commission_amount: number;
      orders_count: number;
    }
  >();

  let commissionsPending = 0;
  let commissionsPaid = 0;

  for (const c of commissions ?? []) {
    const uid = c.user_id;
    const prof = c.profiles as
      | { display_name?: string; email?: string }
      | null;

    if (!personMap.has(uid)) {
      personMap.set(uid, {
        display_name: prof?.display_name ?? null,
        email: prof?.email ?? null,
        total_revenue: 0,
        commission_amount: 0,
        orders_count: 0,
      });
    }
    const entry = personMap.get(uid)!;
    entry.total_revenue += Number(c.total_revenue) || 0;
    entry.commission_amount += Number(c.commission_amount) || 0;
    entry.orders_count += 1;

    if (c.is_paid) {
      commissionsPaid += 1;
    } else {
      commissionsPending += 1;
    }
  }

  const breakdownByPerson = Array.from(personMap.entries()).map(
    ([user_id, v]) => ({ user_id, ...v })
  );

  const { data: cutoff, error: insertError } = await supabase
    .from("sales_cutoffs")
    .insert({
      tenant_id,
      period_start: periodStart,
      period_end: now,
      total_orders: paidOrders.length,
      total_revenue: totalRevenue,
      total_cost: totalCost,
      gross_profit: totalRevenue - totalCost,
      commissions_pending: commissionsPending,
      commissions_paid: commissionsPaid,
      breakdown_by_person: breakdownByPerson,
      breakdown_by_payment_method: byPaymentMethod,
      created_by: user.id,
      notes: notes ?? null,
    })
    .select()
    .single();

  if (insertError) {
    return NextResponse.json({ error: insertError.message }, { status: 500 });
  }

  return NextResponse.json(cutoff, { status: 201 });
}
