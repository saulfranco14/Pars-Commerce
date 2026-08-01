import { NextResponse } from "next/server";

import { createAdminClient } from "@/lib/supabase/admin";
import { preferenceClient } from "@/lib/mercadopago";

const METHODS = ["efectivo", "transferencia", "tarjeta", "mercadopago"] as const;
type Method = (typeof METHODS)[number];

export async function POST(request: Request) {
  const fingerprint = request.headers.get("x-fingerprint-id")?.trim();
  const body = (await request.json()) as {
    order_id?: string;
    amount?: number;
    method?: Method;
  };
  const amount = Math.round(Number(body.amount) * 100) / 100;
  if (!fingerprint || !body.order_id || !METHODS.includes(body.method as Method) || !Number.isFinite(amount) || amount <= 0) {
    return NextResponse.json({ error: "Datos de propina no validos" }, { status: 400 });
  }

  const admin = createAdminClient();
  const { data: order } = await admin
    .from("orders")
    .select("id, status, assigned_to")
    .eq("id", body.order_id)
    .maybeSingle();
  if (!order || order.status !== "paid") {
    return NextResponse.json({ error: "La cuenta debe estar pagada antes de dejar propina" }, { status: 409 });
  }
  if (!order.assigned_to) {
    return NextResponse.json(
      {
        error:
          "La propina estará disponible cuando el negocio asigne a quien te atendió.",
      },
      { status: 409 },
    );
  }
  const { data: device } = await admin
    .from("order_devices")
    .select("id")
    .eq("order_id", order.id)
    .eq("device_fingerprint", fingerprint)
    .maybeSingle();
  if (!device) return NextResponse.json({ error: "No identificamos tu sesion" }, { status: 403 });

  const row = {
    order_id: order.id,
    provider: body.method === "mercadopago" ? "mercadopago" : "manual",
    status: body.method === "mercadopago" ? "pending" : "pending",
    amount: 0,
    payment_kind: "single",
    tip_amount: amount,
    tip_recipient_user_id: order.assigned_to,
    processing_fee_amount: 0,
    tip_fee_amount: 0,
    tip_net_amount: 0,
    metadata: { source: "qr_tip", method: body.method, payer_device_id: device.id },
  };
  const { data: payment, error } = await admin.from("payments").insert(row as never).select("id").single();
  if (error || !payment) return NextResponse.json({ error: "No se pudo registrar la propina" }, { status: 500 });

  await admin.from("order_activity_log").insert({
    order_id: order.id, actor_type: "device", actor_id: device.id, actor_label: "cliente",
    action: "tip.intent", payload: { payment_id: payment.id, amount, method: body.method, recipient_user_id: order.assigned_to },
  });
  if (body.method === "mercadopago") {
    const base = (process.env.NEXT_PUBLIC_APP_URL ?? new URL(request.url).origin).replace(/\/$/, "");
    const preference = await preferenceClient.create({
      body: {
        items: [{ id: `qr_tip:${payment.id}`, title: "Propina", quantity: 1, unit_price: amount, currency_id: "MXN" }],
        external_reference: `qr_tip:${payment.id}`,
        notification_url: `${base}/api/mercadopago/webhook`,
        metadata: { source: "qr_tip", payment_id: payment.id },
      },
    });
    if (!preference.init_point) return NextResponse.json({ error: "No se pudo abrir Mercado Pago" }, { status: 502 });
    return NextResponse.json({ success: true, payment_id: payment.id, init_point: preference.init_point });
  }

  return NextResponse.json({ success: true, payment_id: payment.id, status: "pending_validation" });
}
