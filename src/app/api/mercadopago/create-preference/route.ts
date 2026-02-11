import { createClient } from "@/lib/supabase/server";
import { preferenceClient } from "@/lib/mercadopago";
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
  const { order_id } = body as { order_id: string };

  if (!order_id) {
    return NextResponse.json(
      { error: "order_id is required" },
      { status: 400 }
    );
  }

  // Fetch the order with its items
  const { data: order, error: orderError } = await supabase
    .from("orders")
    .select(
      `
      id, status, total, subtotal, discount, tenant_id,
      customer_name, customer_email,
      items:order_items(id, quantity, unit_price, subtotal, product:products(id, name))
    `
    )
    .eq("id", order_id)
    .single();

  if (orderError || !order) {
    return NextResponse.json(
      { error: orderError?.message ?? "Order not found" },
      { status: 404 }
    );
  }

  if (!["completed", "pending_payment"].includes(order.status)) {
    return NextResponse.json(
      {
        error:
          "Order must be in completed or pending_payment status to generate a payment link",
      },
      { status: 409 }
    );
  }

  const orderDiscount = Number(order.discount);
  const orderTotal = Number(order.total);
  const orderItems = (order.items as unknown[]) ?? [];
  const hasDiscount = orderDiscount > 0;

  const items: { id: string; title: string; quantity: number; unit_price: number; currency_id: string }[] =
    hasDiscount || orderItems.length === 0
      ? [{
          id: order.id,
          title: `Orden #${order.id.slice(0, 8)}`,
          quantity: 1,
          unit_price: orderTotal,
          currency_id: "MXN",
        }]
      : orderItems.map((item: unknown) => {
          const i = item as {
            quantity: number;
            unit_price: number;
            product: { id: string; name: string } | null;
          };
          return {
            id: i.product?.id ?? "unknown",
            title: i.product?.name ?? "Producto",
            quantity: i.quantity,
            unit_price: Number(i.unit_price),
            currency_id: "MXN",
          };
        });

  // Determine callback base URL
  const origin =
    request.headers.get("origin") ??
    request.headers.get("referer")?.replace(/\/[^/]*$/, "") ??
    "http://localhost:3000";

  try {
    const preference = await preferenceClient.create({
      body: {
        items,
        external_reference: order_id,
        back_urls: {
          success: `${origin}/api/mercadopago/redirect?status=success&order_id=${order_id}`,
          failure: `${origin}/api/mercadopago/redirect?status=failure&order_id=${order_id}`,
          pending: `${origin}/api/mercadopago/redirect?status=pending&order_id=${order_id}`,
        },
        auto_return: "approved",
        notification_url: `${origin}/api/mercadopago/webhook`,
        payer: order.customer_email
          ? { email: order.customer_email }
          : undefined,
      },
    });

    const paymentLink = preference.init_point ?? preference.sandbox_init_point;
    const preferenceId = preference.id;

    if (!paymentLink) {
      return NextResponse.json(
        { error: "MercadoPago did not return a payment link" },
        { status: 502 }
      );
    }

    // Update order with payment link and set to pending_payment
    const updates: Record<string, unknown> = {
      payment_link: paymentLink,
      mp_preference_id: preferenceId,
      updated_at: new Date().toISOString(),
    };

    if (order.status === "completed") {
      updates.status = "pending_payment";
    }

    await supabase.from("orders").update(updates).eq("id", order_id);

    // Insert payment record
    await supabase.from("payments").insert({
      order_id,
      provider: "mercadopago",
      external_id: preferenceId,
      status: "pending",
      amount: Number(order.total),
      metadata: {
        preference_id: preferenceId,
        init_point: paymentLink,
      },
    });

    return NextResponse.json({
      payment_link: paymentLink,
      preference_id: preferenceId,
    });
  } catch (err: unknown) {
    console.error("MercadoPago preference creation error:", err);
    const message =
      err instanceof Error ? err.message : "Error creating payment preference";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
