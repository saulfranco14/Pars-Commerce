import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";

export interface SalesByPaymentMethod {
  efectivo: number;
  transferencia: number;
  tarjeta: number;
  mercadopago: number;
  other: number;
}

export interface SalesByWeekItem {
  week_start: string;
  total_revenue: number;
  order_count: number;
}

export interface SalesByPersonItem {
  user_id: string;
  display_name: string | null;
  email: string | null;
  total_revenue: number;
  commission_amount: number;
}

export interface ProductsVsServices {
  products_revenue: number;
  services_revenue: number;
  products_count: number;
  services_count: number;
}

export interface SalesAnalyticsResponse {
  byPaymentMethod: SalesByPaymentMethod;
  byWeek: SalesByWeekItem[];
  byPerson: SalesByPersonItem[];
  productsVsServices: ProductsVsServices;
  totalRevenue: number;
  totalCost: number;
  grossProfit: number;
  salesObjective: number | null;
  monthlyRent: number;
}

const PAYMENT_METHODS = ["efectivo", "transferencia", "tarjeta", "mercadopago"];

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
  const dateFrom = searchParams.get("date_from");
  const dateTo = searchParams.get("date_to");

  if (!tenantId) {
    return NextResponse.json(
      { error: "tenant_id is required" },
      { status: 400 }
    );
  }

  const membershipCheck = await supabase
    .from("tenant_memberships")
    .select("user_id")
    .eq("tenant_id", tenantId)
    .eq("user_id", user.id)
    .single();

  if (membershipCheck.error || !membershipCheck.data) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const fromDate = dateFrom?.trim() || null;
  const toDate = dateTo?.trim() || null;

  let ordersQuery = supabase
    .from("orders")
    .select("id, total, payment_method, created_at, paid_at")
    .eq("tenant_id", tenantId)
    .eq("status", "paid");

  if (fromDate) {
    ordersQuery = ordersQuery.gte("paid_at", fromDate);
  }
  if (toDate) {
    ordersQuery = ordersQuery.lte("paid_at", toDate + "T23:59:59.999Z");
  }

  const { data: orders, error: ordersError } = await ordersQuery;

  if (ordersError) {
    return NextResponse.json({ error: ordersError.message }, { status: 500 });
  }

  const paidOrders = orders ?? [];

  const byPaymentMethod: SalesByPaymentMethod = {
    efectivo: 0,
    transferencia: 0,
    tarjeta: 0,
    mercadopago: 0,
    other: 0,
  };

  const weekMap = new Map<string, { total: number; count: number }>();

  let totalRevenue = 0;

  for (const o of paidOrders) {
    const total = Number(o.total) || 0;
    totalRevenue += total;

    const method = (o.payment_method || "").toLowerCase().trim();
    if (PAYMENT_METHODS.includes(method)) {
      byPaymentMethod[method as keyof Omit<SalesByPaymentMethod, "other">] += total;
    } else if (method) {
      byPaymentMethod.other += total;
    } else {
      byPaymentMethod.other += total;
    }

    const createdAt = new Date(o.created_at);
    const d = new Date(createdAt);
    d.setHours(0, 0, 0, 0);
    const dayOfWeek = d.getDay();
    const diff = dayOfWeek === 0 ? 6 : dayOfWeek - 1;
    d.setDate(d.getDate() - diff);
    const weekKey = d.toISOString().split("T")[0];
    const existing = weekMap.get(weekKey);
    if (existing) {
      existing.total += total;
      existing.count += 1;
    } else {
      weekMap.set(weekKey, { total, count: 1 });
    }
  }

  const byWeek: SalesByWeekItem[] = Array.from(weekMap.entries())
    .map(([week_start, v]) => ({
      week_start,
      total_revenue: v.total,
      order_count: v.count,
    }))
    .sort((a, b) => a.week_start.localeCompare(b.week_start));

  let commissionsQuery = supabase
    .from("sales_commissions")
    .select(
      `
      user_id,
      total_revenue,
      commission_amount,
      products_count,
      services_count,
      created_at,
      profiles!sales_commissions_user_id_fkey(id, display_name, email)
    `
    )
    .eq("tenant_id", tenantId)
    .is("voided_at", null);

  if (fromDate) {
    commissionsQuery = commissionsQuery.gte("created_at", fromDate);
  }
  if (toDate) {
    commissionsQuery = commissionsQuery.lte("created_at", toDate + "T23:59:59.999Z");
  }

  const { data: commissions, error: commissionsError } = await commissionsQuery;

  if (commissionsError) {
    return NextResponse.json({ error: commissionsError.message }, { status: 500 });
  }

  const byPersonMap = new Map<
    string,
    { display_name: string | null; email: string | null; total_revenue: number; commission_amount: number }
  >();

  let products_revenue = 0;
  let services_revenue = 0;
  let products_count = 0;
  let services_count = 0;

  for (const c of commissions ?? []) {
    const uid = c.user_id;
    const rev = Number(c.total_revenue) || 0;
    const comm = Number(c.commission_amount) || 0;
    products_count += Number(c.products_count) || 0;
    services_count += Number(c.services_count) || 0;

    const prof = c.profiles as { display_name?: string; email?: string } | null;
    const displayName = prof?.display_name ?? null;
    const email = prof?.email ?? null;

    if (!byPersonMap.has(uid)) {
      byPersonMap.set(uid, {
        display_name: displayName ?? null,
        email: email ?? null,
        total_revenue: 0,
        commission_amount: 0,
      });
    }
    const entry = byPersonMap.get(uid)!;
    entry.total_revenue += rev;
    entry.commission_amount += comm;
  }

  let totalCost = 0;
  const orderIds = paidOrders.map((o) => o.id);
  if (orderIds.length > 0) {
    const { data: items } = await supabase
      .from("order_items")
      .select("order_id, quantity, unit_price, subtotal, product:products(type, cost_price)")
      .in("order_id", orderIds);

    for (const it of items ?? []) {
      const item = it as {
        quantity: number;
        subtotal: number;
        product: { type: string; cost_price: number } | { type: string; cost_price: number }[];
      };
      const subtotal = Number(item.subtotal) || 0;
      const prod = Array.isArray(item.product) ? item.product[0] : item.product;
      const type = prod?.type ?? "product";
      const costPrice = Number(prod?.cost_price ?? 0) || 0;
      const qty = Number(item.quantity) || 0;
      totalCost += costPrice * qty;
      if (type === "service") {
        services_revenue += subtotal;
      } else {
        products_revenue += subtotal;
      }
    }
  }

  const grossProfit = totalRevenue - totalCost;

  const byPerson: SalesByPersonItem[] = Array.from(byPersonMap.entries()).map(
    ([user_id, v]) => ({
      user_id,
      display_name: v.display_name,
      email: v.email,
      total_revenue: v.total_revenue,
      commission_amount: v.commission_amount,
    })
  );

  let salesObjective: number | null = null;
  let monthlyRent = 0;
  const { data: salesConfig } = await supabase
    .from("tenant_sales_config")
    .select("monthly_sales_objective, monthly_rent")
    .eq("tenant_id", tenantId)
    .single();

  if (salesConfig) {
    if (salesConfig.monthly_sales_objective != null) {
      salesObjective = Number(salesConfig.monthly_sales_objective);
    }
    if (salesConfig.monthly_rent != null) {
      monthlyRent = Number(salesConfig.monthly_rent) || 0;
    }
  }

  const response: SalesAnalyticsResponse = {
    byPaymentMethod,
    byWeek,
    byPerson,
    productsVsServices: {
      products_revenue,
      services_revenue,
      products_count,
      services_count,
    },
    totalRevenue,
    totalCost,
    grossProfit,
    salesObjective,
    monthlyRent,
  };

  return NextResponse.json(response);
}
