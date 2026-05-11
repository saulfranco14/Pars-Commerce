import { NextResponse } from "next/server";

import { createAdminClient } from "@/lib/supabase/admin";

interface RouteContext {
  params: Promise<{ groupId: string }>;
}

interface SplitCheckoutBody {
  method: "mercadopago" | "efectivo" | "transferencia";
}

export async function POST(request: Request, context: RouteContext) {
  const { groupId } = await context.params;
  const body = (await request.json()) as SplitCheckoutBody;
  const admin = createAdminClient();

  const { data: group } = await admin
    .from("order_split_groups")
    .select("id, order_id, total, paid_total, balance_due, payment_status")
    .eq("id", groupId)
    .single();

  if (!group) {
    return NextResponse.json({ error: "Grupo no encontrado" }, { status: 404 });
  }

  if (group.payment_status === "paid") {
    return NextResponse.json({ success: true, already_paid: true });
  }

  const now = new Date().toISOString();
  const amount = Number(group.balance_due ?? group.total);

  await admin
    .from("order_split_groups")
    .update({
      paid_total: Number(group.total),
      balance_due: 0,
      payment_status: "paid",
      updated_at: now,
    })
    .eq("id", groupId);

  await admin.from("payments").insert({
    order_id: group.order_id,
    provider: body.method === "mercadopago" ? "mercadopago" : "manual",
    status: "approved",
    amount,
    payment_kind: "partial",
    split_group_id: groupId,
    metadata: {
      source: "qr_split_checkout",
      method: body.method,
    },
  });

  const { data: allGroups } = await admin
    .from("order_split_groups")
    .select("id, payment_status")
    .eq("order_id", group.order_id);

  const allPaid = (allGroups ?? []).every((entry) => entry.payment_status === "paid");
  if (allPaid) {
    await admin
      .from("orders")
      .update({
        status: "paid",
        paid_at: now,
        balance_due: 0,
        paid_total: Number(group.total),
        payment_method: body.method,
      })
      .eq("id", group.order_id);
  }

  await admin.from("order_activity_log").insert({
    order_id: group.order_id,
    actor_type: "device",
    actor_label: "cliente",
    action: "payment.succeeded",
    payload: {
      split_group_id: groupId,
      method: body.method,
      amount,
    },
  });

  return NextResponse.json({ success: true, all_paid: allPaid });
}
