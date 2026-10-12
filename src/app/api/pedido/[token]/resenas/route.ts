/* eslint-disable @typescript-eslint/no-explicit-any -- Commerce schema types are regenerated after the migration rollout. */
import { NextResponse } from "next/server";

import { createAdminClient } from "@/lib/supabase/admin";

type CommerceAdmin = { from: (table: string) => any };

/** A public tracking token can review only its own paid, completed order. */
export async function POST(request: Request, { params }: { params: Promise<{ token: string }> }) {
  const { token } = await params;
  const body = await request.json() as { order_item_id?: string; rating?: number; comment?: string };
  const rating = Number(body.rating);
  if (!body.order_item_id || !Number.isInteger(rating) || rating < 1 || rating > 5) return NextResponse.json({ error: "Elige de 1 a 5 estrellas." }, { status: 400 });
  if ((body.comment ?? "").trim().length > 1500) return NextResponse.json({ error: "La reseña no puede superar 1,500 caracteres." }, { status: 400 });
  const admin = createAdminClient() as unknown as CommerceAdmin;
  const { data: order } = await admin.from("orders").select("id, tenant_id, customer_id, status, payment_verification_status, paid_total").eq("public_tracking_token", token).maybeSingle();
  if (!order) return NextResponse.json({ error: "Pedido no encontrado." }, { status: 404 });
  if (order.status !== "completed" || (order.payment_verification_status !== "approved" && Number(order.paid_total) <= 0)) return NextResponse.json({ error: "La reseña estará disponible cuando el pedido esté pagado y entregado." }, { status: 409 });
  const { data: item } = await admin.from("order_items").select("id, product_id, product_variant_id").eq("id", body.order_item_id).eq("order_id", order.id).maybeSingle();
  if (!item) return NextResponse.json({ error: "Artículo no encontrado en este pedido." }, { status: 404 });
  const { error } = await admin.from("product_reviews").insert({ tenant_id: order.tenant_id, product_id: item.product_id, variant_id: item.product_variant_id ?? null, order_item_id: item.id, customer_id: order.customer_id ?? null, rating, comment: body.comment?.trim() || null, status: "published", published_at: new Date().toISOString() });
  // Idempotente: un doble toque o una respuesta lenta no convierte una reseña
  // ya guardada en un error visible para el cliente.
  if (error?.code === "23505") return NextResponse.json({ success: true, already_reviewed: true });
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ success: true });
}
