import { NextResponse } from "next/server";

import { createAdminClient } from "@/lib/supabase/admin";
import { readJson } from "@/lib/readJson";
import { requirePlatformAdmin } from "@/app/api/platform/_lib";

import { serviceErrorToResponse } from "@/features/qr/services/serviceErrorToResponse";
import { growthDb } from "@/features/growth/services/growthDb";
import { getLeadDetail, recordOutcome, snoozeLead, updateLeadPhone } from "@/features/growth/services/leadService";

import type { LeadOutcome } from "@/features/growth/interfaces/lead";

const ADMIN_OUTCOMES: LeadOutcome[] = ["whatsapp_sent", "whatsapp_replied", "email_replied", "not_interested", "no_whatsapp", "wrong_number", "visit_closed"];

export async function GET(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const gate = await requirePlatformAdmin();
  if ("error" in gate) return gate.error;
  const { id } = await params;
  const result = await getLeadDetail(growthDb(createAdminClient()), id);
  if (!result.ok) return serviceErrorToResponse(result.error);
  return NextResponse.json(result.data);
}

export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const gate = await requirePlatformAdmin();
  if ("error" in gate) return gate.error;
  const { id } = await params;
  const body = await readJson<{ outcome?: LeadOutcome; reason?: string; snoozeDays?: number | null; phone?: string }>(request);
  if (!body) return NextResponse.json({ error: "Cuerpo inválido" }, { status: 400 });
  const db = growthDb(createAdminClient());

  if (body.outcome) {
    if (!ADMIN_OUTCOMES.includes(body.outcome)) return NextResponse.json({ error: "Acción no válida" }, { status: 400 });
    const result = await recordOutcome(db, {
      leadId: id,
      outcome: body.outcome,
      actor: "operator",
      payload: body.outcome === "not_interested" ? { reason: body.reason === "competencia" ? "competencia" : "rechazo" } : {},
    });
    if (!result.ok) return serviceErrorToResponse(result.error);
    return NextResponse.json(result.data);
  }
  if (body.snoozeDays !== undefined) {
    const days = body.snoozeDays === null ? null : Math.min(Math.max(Math.round(body.snoozeDays), 1), 365);
    const result = await snoozeLead(db, id, days);
    if (!result.ok) return serviceErrorToResponse(result.error);
    return NextResponse.json(result.data);
  }
  if (typeof body.phone === "string") {
    const result = await updateLeadPhone(db, id, body.phone);
    if (!result.ok) return serviceErrorToResponse(result.error);
    return NextResponse.json(result.data);
  }
  return NextResponse.json({ error: "Nada que cambiar" }, { status: 400 });
}
