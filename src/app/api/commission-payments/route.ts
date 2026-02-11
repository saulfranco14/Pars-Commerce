import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";

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
  const userId = searchParams.get("user_id");
  const status = searchParams.get("status");
  const periodStart = searchParams.get("period_start");
  const periodEnd = searchParams.get("period_end");

  if (!tenantId) {
    return NextResponse.json(
      { error: "tenant_id is required" },
      { status: 400 }
    );
  }

  let query = supabase
    .from("commission_payments")
    .select(
      `
      id,
      user_id,
      period_type,
      period_start,
      period_end,
      total_orders,
      total_items,
      products_sold,
      services_sold,
      total_revenue,
      total_cost,
      gross_profit,
      commission_amount,
      payment_status,
      paid_at,
      payment_notes,
      created_at,
      profiles:user_id (
        id,
        display_name,
        email
      )
      `
    )
    .eq("tenant_id", tenantId)
    .order("period_start", { ascending: false });

  if (userId) {
    query = query.eq("user_id", userId);
  }

  if (status) {
    query = query.eq("payment_status", status);
  }

  if (periodStart) {
    query = query.gte("period_start", periodStart);
  }

  if (periodEnd) {
    query = query.lte("period_end", periodEnd);
  }

  const { data: payments, error } = await query;

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json(payments ?? []);
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
  const { tenant_id, user_id, period_type, period_start, period_end } =
    body as {
      tenant_id: string;
      user_id: string;
      period_type: string;
      period_start: string;
      period_end: string;
    };

  if (!tenant_id || !user_id || !period_type || !period_start || !period_end) {
    return NextResponse.json(
      {
        error:
          "tenant_id, user_id, period_type, period_start and period_end are required",
      },
      { status: 400 }
    );
  }

  const periodEndInclusive = `${period_end}T23:59:59.999Z`;
  const { data: commissions } = await supabase
    .from("sales_commissions")
    .select("*")
    .eq("tenant_id", tenant_id)
    .eq("user_id", user_id)
    .eq("is_paid", false)
    .is("voided_at", null)
    .gte("created_at", period_start)
    .lte("created_at", periodEndInclusive);

  const totals = (commissions ?? []).reduce(
    (acc, c) => ({
      total_orders: acc.total_orders + 1,
      total_items: acc.total_items + c.total_items_sold,
      products_sold: acc.products_sold + c.products_count,
      services_sold: acc.services_sold + c.services_count,
      total_revenue: acc.total_revenue + Number(c.total_revenue),
      total_cost: acc.total_cost + Number(c.total_cost),
      gross_profit: acc.gross_profit + Number(c.gross_profit),
      commission_amount: acc.commission_amount + Number(c.commission_amount),
    }),
    {
      total_orders: 0,
      total_items: 0,
      products_sold: 0,
      services_sold: 0,
      total_revenue: 0,
      total_cost: 0,
      gross_profit: 0,
      commission_amount: 0,
    }
  );

  const { data: payment, error } = await supabase
    .from("commission_payments")
    .insert({
      tenant_id,
      user_id,
      period_type,
      period_start,
      period_end,
      ...totals,
    })
    .select()
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json(payment);
}

export async function PATCH(request: Request) {
  const supabase = await createClient();
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await request.json();
  const { payment_id, payment_status, payment_notes, commission_amount } =
    body as {
      payment_id: string;
      payment_status?: string;
      payment_notes?: string;
      commission_amount?: number;
    };

  if (!payment_id) {
    return NextResponse.json(
      { error: "payment_id is required" },
      { status: 400 }
    );
  }

  const updates: Record<string, unknown> = {
    updated_at: new Date().toISOString(),
  };

  if (payment_status !== undefined) {
    updates.payment_status = payment_status;
    if (payment_status === "paid") {
      updates.paid_at = new Date().toISOString();
      updates.paid_by = user.id;

      const { data: payment } = await supabase
        .from("commission_payments")
        .select("user_id, period_start, period_end, tenant_id")
        .eq("id", payment_id)
        .single();

      if (payment) {
        const periodEndInclusive = `${payment.period_end}T23:59:59.999Z`;
        await supabase
          .from("sales_commissions")
          .update({
            is_paid: true,
            paid_at: new Date().toISOString(),
            paid_by: user.id,
          })
          .eq("tenant_id", payment.tenant_id)
          .eq("user_id", payment.user_id)
          .is("voided_at", null)
          .gte("created_at", payment.period_start)
          .lte("created_at", periodEndInclusive);
      }
    }
  }

  if (payment_notes !== undefined) {
    updates.payment_notes = payment_notes;
  }

  if (commission_amount !== undefined) {
    updates.commission_amount = Number(commission_amount);
  }

  const { data, error } = await supabase
    .from("commission_payments")
    .update(updates)
    .eq("id", payment_id)
    .select()
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json(data);
}
