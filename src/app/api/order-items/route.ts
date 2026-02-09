import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";

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
  const { order_id, product_id, quantity } = body as {
    order_id: string;
    product_id: string;
    quantity: number;
  };

  if (!order_id || !product_id || quantity == null || quantity < 1) {
    return NextResponse.json(
      { error: "order_id, product_id and quantity (>= 1) are required" },
      { status: 400 }
    );
  }

  const qty = Math.floor(Number(quantity));

  const { data: order, error: orderError } = await supabase
    .from("orders")
    .select("id, tenant_id, status, subtotal, discount, total")
    .eq("id", order_id)
    .single();

  if (orderError || !order) {
    return NextResponse.json(
      { error: orderError?.message ?? "Order not found" },
      { status: 404 }
    );
  }

  if (!["draft", "assigned"].includes(order.status)) {
    return NextResponse.json(
      { error: "Cannot add items to order in current status" },
      { status: 409 }
    );
  }

  const { data: product, error: productError } = await supabase
    .from("products")
    .select("id, price, track_stock, type")
    .eq("id", product_id)
    .eq("tenant_id", order.tenant_id)
    .single();

  if (productError || !product) {
    return NextResponse.json(
      { error: "Product not found or not in this tenant" },
      { status: 404 }
    );
  }

  if (product.track_stock && product.type === "product") {
    const { data: inventory } = await supabase
      .from("product_inventory")
      .select("quantity")
      .eq("product_id", product_id)
      .single();

    const availableStock = inventory?.quantity ?? 0;
    if (availableStock < qty) {
      return NextResponse.json(
        { error: `Stock insuficiente. Disponible: ${availableStock}` },
        { status: 409 }
      );
    }
  }

  const unitPrice = Number(product.price);
  const subtotal = unitPrice * qty;

  const { data: item, error: insertError } = await supabase
    .from("order_items")
    .insert({
      order_id,
      product_id,
      quantity: qty,
      unit_price: unitPrice,
      subtotal,
    })
    .select("id, quantity, unit_price, subtotal")
    .single();

  if (insertError) {
    return NextResponse.json({ error: insertError.message }, { status: 500 });
  }

  const newSubtotal = Number(order.subtotal) + subtotal;
  const newTotal = newSubtotal - Number(order.discount);

  await supabase
    .from("orders")
    .update({
      subtotal: newSubtotal,
      total: newTotal,
      updated_at: new Date().toISOString(),
    })
    .eq("id", order_id);

  return NextResponse.json(item);
}

export async function DELETE(request: Request) {
  const supabase = await createClient();
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const itemId = searchParams.get("item_id");

  if (!itemId) {
    return NextResponse.json({ error: "item_id is required" }, { status: 400 });
  }

  const { data: item, error: itemError } = await supabase
    .from("order_items")
    .select("id, order_id, subtotal")
    .eq("id", itemId)
    .single();

  if (itemError || !item) {
    return NextResponse.json(
      { error: "Order item not found" },
      { status: 404 }
    );
  }

  const { data: order } = await supabase
    .from("orders")
    .select("id, status, subtotal, discount")
    .eq("id", item.order_id)
    .single();

  if (!order || !["draft", "assigned"].includes(order.status)) {
    return NextResponse.json(
      { error: "Cannot remove items from order in current status" },
      { status: 409 }
    );
  }

  await supabase.from("order_items").delete().eq("id", itemId);

  const newSubtotal = Math.max(
    0,
    Number(order.subtotal) - Number(item.subtotal)
  );
  const newTotal = newSubtotal - Number(order.discount);

  await supabase
    .from("orders")
    .update({
      subtotal: newSubtotal,
      total: newTotal,
      updated_at: new Date().toISOString(),
    })
    .eq("id", item.order_id);

  return NextResponse.json({ success: true });
}
