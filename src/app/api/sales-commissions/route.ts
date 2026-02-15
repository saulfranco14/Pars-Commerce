import { createClient } from "@/lib/supabase/server";
import { getMexicoDateBounds } from "@/lib/dateBounds";
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
  const isPaid = searchParams.get("is_paid");
  const dateFrom = searchParams.get("date_from");
  const dateTo = searchParams.get("date_to");

  if (!tenantId) {
    return NextResponse.json(
      { error: "tenant_id is required" },
      { status: 400 }
    );
  }

  let query = supabase
    .from("sales_commissions")
    .select(
      `
      id,
      order_id,
      user_id,
      total_items_sold,
      products_count,
      services_count,
      total_revenue,
      total_cost,
      gross_profit,
      commission_amount,
      commission_config,
      is_paid,
      paid_at,
      created_at,
      profiles!sales_commissions_user_id_fkey (
        id,
        email,
        display_name
      ),
      orders!sales_commissions_order_id_fkey (
        id,
        created_at,
        status,
        payment_method
      )
      `
    )
    .eq("tenant_id", tenantId)
    .is("voided_at", null)
    .order("created_at", { ascending: false });

  if (userId) {
    query = query.eq("user_id", userId);
  }

  if (isPaid === "true") {
    query = query.eq("is_paid", true);
  } else if (isPaid === "false") {
    query = query.eq("is_paid", false);
  }

  if (dateFrom) {
    const { startUTC } = getMexicoDateBounds(dateFrom);
    query = query.gte("created_at", startUTC);
  }

  if (dateTo) {
    const { endUTC } = getMexicoDateBounds(dateTo);
    query = query.lte("created_at", endUTC);
  }

  const { data: commissions, error } = await query;

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json(commissions ?? []);
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
  const { commission_id, is_paid, commission_amount } = body as {
    commission_id: string;
    is_paid?: boolean;
    commission_amount?: number;
  };

  if (!commission_id) {
    return NextResponse.json(
      { error: "commission_id is required" },
      { status: 400 }
    );
  }

  const updates: Record<string, unknown> = {
    updated_at: new Date().toISOString(),
  };

  if (is_paid !== undefined) {
    updates.is_paid = is_paid;
    if (is_paid) {
      updates.paid_at = new Date().toISOString();
      updates.paid_by = user.id;
    } else {
      updates.paid_at = null;
      updates.paid_by = null;
    }
  }

  if (commission_amount !== undefined) {
    updates.commission_amount = Number(commission_amount);
  }

  const { data: commission, error } = await supabase
    .from("sales_commissions")
    .update(updates)
    .eq("id", commission_id)
    .select(
      `
      id,
      order_id,
      user_id,
      total_items_sold,
      products_count,
      services_count,
      total_revenue,
      total_cost,
      gross_profit,
      commission_amount,
      commission_config,
      is_paid,
      paid_at,
      created_at,
      profiles!sales_commissions_user_id_fkey (
        id,
        email,
        display_name
      ),
      orders!sales_commissions_order_id_fkey (
        id,
        created_at,
        status,
        payment_method
      )
      `
    )
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json(commission);
}
