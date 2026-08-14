/* eslint-disable @typescript-eslint/no-explicit-any -- communication_events is introduced by this release migration. */
import { NextResponse } from "next/server";

import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { requirePermission } from "@/lib/auth/requirePermission";

const E164 = /^\+[1-9]\d{7,14}$/;
const ENTITY_TABLES = {
  order: "orders",
  loan: "loans",
  subscription: "subscriptions",
  // Agenda currently schedules orders; it does not have a separate table.
  appointment: "orders",
} as const;

type EntityType = keyof typeof ENTITY_TABLES;

function isEntityType(value: unknown): value is EntityType {
  return typeof value === "string" && value in ENTITY_TABLES;
}

function safeMessage(type: EntityType, reference: string): string {
  const label = type === "loan" ? "tu recordatorio" : type === "subscription" ? "la administración de tu suscripción" : type === "appointment" ? "tu cita" : "tu pedido";
  return `Hola, te compartimos información sobre ${label} (${reference}).`;
}

export async function POST(request: Request) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  let body: { tenant_id?: string; entity_type?: unknown; entity_id?: string; recipient_phone?: string | null; event_type?: string };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "JSON inválido." }, { status: 400 });
  }
  if (!body.tenant_id || !body.entity_id || !isEntityType(body.entity_type)) {
    return NextResponse.json({ error: "Entidad de comunicación inválida." }, { status: 400 });
  }
  const phone = body.recipient_phone?.trim();
  if (!phone || !E164.test(phone)) {
    return NextResponse.json({ error: "El teléfono debe usar formato internacional, por ejemplo +5215512345678." }, { status: 400 });
  }

  const allowed = await requirePermission(user.id, body.tenant_id, "orders.read");
  if (!allowed) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const admin = createAdminClient() as any;
  const table = ENTITY_TABLES[body.entity_type];
  const { data: entity } = await admin.from(table).select("id, tenant_id").eq("id", body.entity_id).maybeSingle();
  if (!entity || entity.tenant_id !== body.tenant_id) {
    return NextResponse.json({ error: "No encontramos la entidad en este negocio." }, { status: 404 });
  }
  if (body.entity_type === "appointment" && !(await admin.from("orders").select("scheduled_for").eq("id", body.entity_id).not("scheduled_for", "is", null).maybeSingle()).data) {
    return NextResponse.json({ error: "La cita no tiene una fecha programada." }, { status: 409 });
  }

  const eventType = body.event_type?.trim().slice(0, 80) || "whatsapp_opened";
  const { error } = await admin.from("communication_events").insert({
    tenant_id: body.tenant_id,
    channel: "whatsapp",
    entity_type: body.entity_type,
    entity_id: body.entity_id,
    event_type: eventType,
    initiated_by: user.id,
    metadata: { template: eventType },
  });
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  return NextResponse.json({
    whatsapp_url: `https://wa.me/${phone.slice(1)}?text=${encodeURIComponent(safeMessage(body.entity_type, body.entity_id.slice(0, 8).toUpperCase()))}`,
  });
}
