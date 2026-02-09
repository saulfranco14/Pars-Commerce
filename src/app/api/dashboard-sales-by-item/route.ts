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
  const dateFrom = searchParams.get("date_from");
  const dateTo = searchParams.get("date_to");

  if (!tenantId) {
    return NextResponse.json(
      { error: "tenant_id is required" },
      { status: 400 }
    );
  }

  let from = dateFrom?.trim();
  let to = dateTo?.trim();
  if (!from) {
    const d = new Date();
    d.setDate(d.getDate() - 30);
    from = d.toISOString().slice(0, 10);
  }
  if (!to) {
    to = new Date().toISOString().slice(0, 10);
  }
  const toEnd = to + "T23:59:59.999Z";

  const { data: orders, error: ordersError } = await supabase
    .from("orders")
    .select("id")
    .eq("tenant_id", tenantId)
    .in("status", ["paid", "completed"])
    .gte("created_at", from)
    .lte("created_at", toEnd);

  if (ordersError) {
    return NextResponse.json({ error: ordersError.message }, { status: 500 });
  }

  const orderIds = (orders ?? []).map((o) => o.id);
  if (orderIds.length === 0) {
    return NextResponse.json({
      products: [],
      services: [],
    });
  }

  const { data: items, error: itemsError } = await supabase
    .from("order_items")
    .select("product_id, quantity, subtotal")
    .in("order_id", orderIds);

  if (itemsError) {
    return NextResponse.json({ error: itemsError.message }, { status: 500 });
  }

  const productIds = [
    ...new Set(
      (items ?? []).map((i) => (i as { product_id: string }).product_id)
    ),
  ];
  if (productIds.length === 0) {
    return NextResponse.json({
      products: [],
      services: [],
    });
  }

  const { data: products, error: productsError } = await supabase
    .from("products")
    .select("id, name, type")
    .in("id", productIds);

  if (productsError) {
    return NextResponse.json({ error: productsError.message }, { status: 500 });
  }

  const byProduct: Record<
    string,
    { quantity: number; total: number; name: string; type: string }
  > = {};
  const nameById: Record<string, { name: string; type: string }> = {};
  for (const p of products ?? []) {
    nameById[p.id] = { name: p.name, type: p.type };
    byProduct[p.id] = {
      quantity: 0,
      total: 0,
      name: p.name,
      type: p.type,
    };
  }
  for (const i of items ?? []) {
    const pid = (i as { product_id: string }).product_id;
    const q = Number((i as { quantity: number }).quantity);
    const sub = Number((i as { subtotal: number }).subtotal);
    if (byProduct[pid]) {
      byProduct[pid].quantity += q;
      byProduct[pid].total += sub;
    }
  }

  const productList = Object.entries(byProduct)
    .filter(([, v]) => v.type === "product")
    .map(([id, v]) => ({
      id,
      name: v.name,
      quantity: v.quantity,
      total: v.total,
    }))
    .sort((a, b) => b.total - a.total)
    .slice(0, 10);

  const serviceList = Object.entries(byProduct)
    .filter(([, v]) => v.type === "service")
    .map(([id, v]) => ({
      id,
      name: v.name,
      quantity: v.quantity,
      total: v.total,
    }))
    .sort((a, b) => b.total - a.total)
    .slice(0, 10);

  return NextResponse.json({
    products: productList,
    services: serviceList,
  });
}
