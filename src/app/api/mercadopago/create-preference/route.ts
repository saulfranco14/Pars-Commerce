import { createClient } from "@/lib/supabase/server";
import { preferenceClient } from "@/lib/mercadopago";
import {
  calcBuyerTotal,
  TARIFA_DE_SERVICIO_LABEL,
} from "@/constants/commissionConfig";
import { MP_ITEM_CATEGORY_OTHERS } from "@/constants/mercadopagoCategories";
import { buildPayerFromCustomer } from "@/lib/mercadopagoPayer";
import { resolveUserError } from "@/lib/errors/resolveUserError";
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
      { status: 400 },
    );
  }

  // Fetch the order with its items
  const { data: order, error: orderError } = await supabase
    .from("orders")
    .select(
      `
      id, status, total, subtotal, discount, tenant_id,
      customer_name, customer_email, customer_phone,
      items:order_items(id, quantity, unit_price, subtotal, product:products(id, name, description))
    `,
    )
    .eq("id", order_id)
    .single();

  if (orderError || !order) {
    return NextResponse.json(
      { error: orderError?.message ?? "Order not found" },
      { status: 404 },
    );
  }

  if (!["completed", "pending_payment"].includes(order.status)) {
    return NextResponse.json(
      {
        error:
          "Order must be in completed or pending_payment status to generate a payment link",
      },
      { status: 409 },
    );
  }

  if (!order.customer_name?.trim() || order.customer_name.trim().length < 2) {
    return NextResponse.json(
      {
        error:
          "Para generar el link de pago con Mercado Pago necesitamos el nombre del cliente. Agrega el nombre en los datos de la orden.",
      },
      { status: 400 },
    );
  }

  if (!order.customer_email?.trim()) {
    return NextResponse.json(
      {
        error:
          "Para generar el link de pago con Mercado Pago necesitamos el email del cliente. Agrega el email en los datos de la orden.",
      },
      { status: 400 },
    );
  }

  const orderDiscount = Number(order.discount);
  const orderTotal = Number(order.total);
  const orderItems = (order.items as unknown[]) ?? [];
  const hasDiscount = orderDiscount > 0;
  const { total: buyerTotal, mpFee, parsFee } = calcBuyerTotal(orderTotal);

  const baseItems: {
    id: string;
    title: string;
    quantity: number;
    unit_price: number;
    currency_id: string;
    category_id: string;
    description: string;
  }[] =
    hasDiscount || orderItems.length === 0
      ? [
          {
            id: order.id,
            title: `Orden #${order.id.slice(0, 8)}`,
            quantity: 1,
            unit_price: Math.round(orderTotal * 100) / 100,
            currency_id: "MXN",
            category_id: MP_ITEM_CATEGORY_OTHERS,
            description: "Orden",
          },
        ]
      : orderItems.map((item: unknown) => {
          const i = item as {
            quantity: number;
            unit_price: number;
            product: { id: string; name: string; description?: string | null } | null;
          };
          const product = i.product;
          const desc =
            product?.description || product?.name || "Producto";
          return {
            id: product?.id ?? "unknown",
            title: product?.name ?? "Producto",
            quantity: i.quantity,
            unit_price: Number(i.unit_price),
            currency_id: "MXN",
            category_id: MP_ITEM_CATEGORY_OTHERS,
            description: desc.slice(0, 256),
          };
        });

  const mpFeeRounded = Math.round(mpFee * 100) / 100;
  const parsFeeRounded = Math.round(parsFee * 100) / 100;

  const items = [
    ...baseItems,
    ...(mpFeeRounded > 0
      ? [
          {
            id: "mp-fee",
            title: "Comisión Mercado Pago",
            quantity: 1,
            unit_price: mpFeeRounded,
            currency_id: "MXN" as const,
            category_id: MP_ITEM_CATEGORY_OTHERS,
            description: "Comisión",
          },
        ]
      : []),
    {
      id: "pars-fee",
      title: TARIFA_DE_SERVICIO_LABEL,
      quantity: 1,
      unit_price: parsFeeRounded,
      currency_id: "MXN" as const,
      category_id: MP_ITEM_CATEGORY_OTHERS,
      description: "Comisión",
    },
  ];

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
        payer: buildPayerFromCustomer({
          customerName: order.customer_name,
          customerEmail: order.customer_email,
          customerPhone: order.customer_phone,
        }),
      },
    });

    const paymentLink = preference.init_point ?? preference.sandbox_init_point;
    const preferenceId = preference.id;

    if (!paymentLink) {
      return NextResponse.json(
        { error: "MercadoPago did not return a payment link" },
        { status: 502 },
      );
    }

    const updates: Record<string, unknown> = {
      payment_link: paymentLink,
      mp_preference_id: preferenceId,
      payment_method: "mercadopago",
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
    return NextResponse.json(
      { error: resolveUserError(err, "mercadopago") },
      { status: 500 }
    );
  }
}
