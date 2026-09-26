import { NextResponse } from "next/server";

import { validateOrderStock } from "@/features/inventory/services/orderStockValidationService";
import { createClient } from "@/lib/supabase/server";

type BatchLine = { product_id?: unknown; quantity?: unknown };
type RpcClient = {
  rpc: (name: string, args: Record<string, unknown>) => Promise<{ error: { message: string } | null }>;
};

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { id: orderId } = await params;
  const body = await request.json().catch(() => ({})) as { items?: BatchLine[] };
  const byProduct = new Map<string, number>();
  for (const line of body.items ?? []) {
    const productId = typeof line.product_id === "string" ? line.product_id : "";
    const quantity = Math.floor(Number(line.quantity));
    if (!productId || !Number.isFinite(quantity) || quantity < 1 || quantity > 999) {
      return NextResponse.json({ error: "Los artículos o cantidades no son válidos." }, { status: 400 });
    }
    byProduct.set(productId, (byProduct.get(productId) ?? 0) + quantity);
  }
  const items = [...byProduct].map(([product_id, quantity]) => ({ product_id, quantity }));
  if (!items.length) return NextResponse.json({ error: "Selecciona al menos un artículo." }, { status: 400 });

  const { data: order, error: orderError } = await supabase
    .from("orders")
    .select("id, tenant_id, status")
    .eq("id", orderId)
    .maybeSingle();
  if (orderError || !order) return NextResponse.json({ error: "Orden no encontrada." }, { status: 404 });
  if (!["draft", "assigned"].includes(order.status)) {
    return NextResponse.json({ error: "Esta orden ya no permite agregar artículos." }, { status: 409 });
  }

  const preflight = await validateOrderStock(supabase, order.tenant_id, items);
  if (!preflight.ok) return NextResponse.json({ error: preflight.message }, { status: 409 });

  const { error } = await (supabase as unknown as RpcClient).rpc("add_order_items_batch", {
    p_order_id: orderId,
    p_items: items,
  });
  if (error) return NextResponse.json({ error: error.message }, { status: 409 });
  return NextResponse.json({ success: true, count: items.length });
}
