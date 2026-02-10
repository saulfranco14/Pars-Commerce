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
  const orderId = searchParams.get("order_id");
  const status = searchParams.get("status");
  const dateFrom = searchParams.get("date_from");
  const dateTo = searchParams.get("date_to");

  if (orderId) {
    const { data: order, error: orderError } = await supabase
      .from("orders")
      .select(
        `
        id, status, customer_name, customer_email, customer_phone,
        subtotal, discount, total, created_at, updated_at,
        created_by, assigned_to, completed_by, completed_at, paid_at,
        payment_method,
        assigned_user:profiles!orders_assigned_to_fkey(id, display_name, email),
        items:order_items(id, quantity, unit_price, subtotal, product:products(id, name, type))
      `
      )
      .eq("id", orderId)
      .single();

    if (orderError || !order) {
      return NextResponse.json(
        { error: orderError?.message ?? "Order not found" },
        { status: 404 }
      );
    }
    return NextResponse.json(order);
  }

  if (!tenantId) {
    return NextResponse.json(
      { error: "tenant_id or order_id is required" },
      { status: 400 }
    );
  }

  let query = supabase
    .from("orders")
    .select(
      `
      id, status, customer_name, customer_email, total, created_at, assigned_to,
      assigned_user:profiles!orders_assigned_to_fkey(id, display_name, email)
      `
    )
    .eq("tenant_id", tenantId)
    .order("created_at", { ascending: false });

  if (status?.trim()) {
    query = query.eq("status", status.trim());
  }
  if (dateFrom?.trim()) {
    query = query.gte("created_at", dateFrom.trim());
  }
  if (dateTo?.trim()) {
    query = query.lte("created_at", dateTo.trim() + "T23:59:59.999Z");
  }

  const { data: orders, error } = await query;

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  const list = orders ?? [];
  if (list.length === 0) return NextResponse.json([]);

  const orderIds = list.map((o) => o.id);
  const { data: items } = await supabase
    .from("order_items")
    .select("order_id, product_id")
    .in("order_id", orderIds);

  const productIds = [
    ...new Set(
      (items ?? []).map((it) => (it as { product_id: string }).product_id)
    ),
  ];
  const productTypes: Record<string, string> = {};
  if (productIds.length > 0) {
    const { data: prods } = await supabase
      .from("products")
      .select("id, type")
      .in("id", productIds);
    for (const p of prods ?? []) {
      productTypes[p.id] = p.type;
    }
  }

  const productsCountByOrder: Record<string, number> = {};
  const servicesCountByOrder: Record<string, number> = {};
  for (const it of items ?? []) {
    const oid = (it as { order_id: string }).order_id;
    const pid = (it as { product_id: string }).product_id;
    const type = productTypes[pid];
    if (type === "product") {
      productsCountByOrder[oid] = (productsCountByOrder[oid] ?? 0) + 1;
    } else if (type === "service") {
      servicesCountByOrder[oid] = (servicesCountByOrder[oid] ?? 0) + 1;
    }
  }

  const withType = list.map((o) => ({
    ...o,
    products_count: productsCountByOrder[o.id] ?? 0,
    services_count: servicesCountByOrder[o.id] ?? 0,
  }));

  return NextResponse.json(withType);
}

const ALLOWED_TRANSITIONS: Record<string, string[]> = {
  draft: ["assigned", "in_progress", "cancelled"],
  assigned: ["in_progress", "cancelled"],
  in_progress: ["completed", "cancelled"],
  completed: ["pending_payment", "paid"],
  pending_payment: ["paid"],
  paid: [],
  cancelled: [],
};

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
  const {
    order_id,
    status,
    assigned_to,
    payment_method,
    customer_name,
    customer_email,
    customer_phone,
  } = body as {
    order_id: string;
    status?: string;
    assigned_to?: string | null;
    payment_method?: string | null;
    customer_name?: string | null;
    customer_email?: string | null;
    customer_phone?: string | null;
  };

  if (!order_id) {
    return NextResponse.json(
      { error: "order_id is required" },
      { status: 400 }
    );
  }

  const { data: order, error: fetchError } = await supabase
    .from("orders")
    .select("id, status")
    .eq("id", order_id)
    .single();

  if (fetchError || !order) {
    return NextResponse.json(
      { error: fetchError?.message ?? "Order not found" },
      { status: 404 }
    );
  }

  const updates: Record<string, unknown> = {
    updated_at: new Date().toISOString(),
  };

  if (status !== undefined) {
    const allowed = ALLOWED_TRANSITIONS[order.status];
    if (!allowed?.includes(status)) {
      return NextResponse.json(
        { error: `Cannot transition from ${order.status} to ${status}` },
        { status: 409 }
      );
    }
    updates.status = status;
    if (status === "paid") {
      updates.paid_at = new Date().toISOString();
    }
    if (status === "completed") {
      updates.completed_at = new Date().toISOString();
      updates.completed_by = user.id;
    }
  }

  if (assigned_to !== undefined) updates.assigned_to = assigned_to || null;
  if (payment_method !== undefined)
    updates.payment_method = payment_method?.trim() || null;
  if (customer_name !== undefined)
    updates.customer_name = customer_name?.trim() || null;
  if (customer_email !== undefined)
    updates.customer_email = customer_email?.trim() || null;
  if (customer_phone !== undefined)
    updates.customer_phone = customer_phone?.trim() || null;

  const { data: updated, error } = await supabase
    .from("orders")
    .update(updates)
    .eq("id", order_id)
    .select("id, status, assigned_to, paid_at")
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json(updated);
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
  const {
    tenant_id,
    customer_name,
    customer_email,
    customer_phone,
    assigned_to,
  } = body as {
    tenant_id: string;
    customer_name?: string;
    customer_email?: string;
    customer_phone?: string;
    assigned_to?: string;
  };

  if (!tenant_id) {
    return NextResponse.json(
      { error: "tenant_id is required" },
      { status: 400 }
    );
  }

  const initialStatus = assigned_to ? "assigned" : "draft";

  const { data: order, error } = await supabase
    .from("orders")
    .insert({
      tenant_id,
      status: initialStatus,
      subtotal: 0,
      discount: 0,
      total: 0,
      source: "dashboard",
      created_by: user.id,
      assigned_to: assigned_to || null,
      customer_name: customer_name?.trim() || null,
      customer_email: customer_email?.trim() || null,
      customer_phone: customer_phone?.trim() || null,
    })
    .select("id, status, customer_name, total, created_at")
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json(order);
}
