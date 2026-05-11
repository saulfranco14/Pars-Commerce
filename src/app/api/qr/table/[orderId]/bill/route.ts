import { NextResponse } from "next/server";

import { createAdminClient } from "@/lib/supabase/admin";

interface RouteContext {
  params: Promise<{ orderId: string }>;
}

export async function GET(_request: Request, context: RouteContext) {
  const { orderId } = await context.params;
  const admin = createAdminClient();

  const { data: order } = await admin
    .from("orders")
    .select("id, status, total, paid_total, balance_due")
    .eq("id", orderId)
    .single();

  if (!order) {
    return NextResponse.json({ error: "Orden no encontrada" }, { status: 404 });
  }

  const { data: splitGroups } = await admin
    .from("order_split_groups")
    .select("id, label, total, paid_total, balance_due, payment_status, device_id")
    .eq("order_id", orderId)
    .order("created_at", { ascending: true });

  const groups =
    splitGroups && splitGroups.length > 0
      ? splitGroups
      : [
          {
            id: `order-${order.id}`,
            label: "Cuenta total",
            total: Number(order.total),
            paid_total: Number(order.paid_total ?? 0),
            balance_due: Number(order.balance_due ?? order.total),
            payment_status: Number(order.balance_due ?? order.total) <= 0 ? "paid" : "pending",
            device_id: null,
          },
        ];

  return NextResponse.json({
    order: {
      id: order.id,
      status: order.status,
      total: Number(order.total),
      paid_total: Number(order.paid_total ?? 0),
      balance_due: Number(order.balance_due ?? order.total),
    },
    groups,
  });
}
