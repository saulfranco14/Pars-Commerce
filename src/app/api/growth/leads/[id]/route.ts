import { NextResponse } from "next/server";

import { readJson } from "@/lib/readJson";
import { requireGrowthMember } from "@/app/api/growth/_lib";

import { serviceErrorToResponse } from "@/features/qr/services/serviceErrorToResponse";
import {
  getLeadDetail,
  recordOutcome,
  skipLead,
  snoozeLead,
  updateLeadEmail,
  updateLeadGiro,
  updateLeadPhone,
} from "@/features/growth/services/leadService";

import { WHATSAPP_STEPS } from "@/features/growth/constants/templateVariables";

import type { LeadOutcome } from "@/features/growth/interfaces/lead";
import type { SentWhatsapp } from "@/features/growth/interfaces/whatsapp";

const OPERATOR_OUTCOMES: LeadOutcome[] = ["whatsapp_sent", "whatsapp_replied", "email_replied", "not_interested", "no_whatsapp", "wrong_number", "visit_closed"];

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

type LeadPatch = { outcome?: LeadOutcome; reason?: string; reply?: string; sent?: Partial<SentWhatsapp>; snoozeDays?: number | null; phone?: string; email?: string; giro?: string; skip?: boolean };

/** The exact text, step and variant sent, so the conversation shows what the prospect read and the next step never repeats it. */
function sentPayload(sent: Partial<SentWhatsapp> | undefined): { payload: Record<string, unknown>; templateId: string | null } {
  if (!sent) return { payload: {}, templateId: null };
  const payload: Record<string, unknown> = {};
  if (typeof sent.body === "string" && sent.body.trim()) payload.body = sent.body.trim().slice(0, 4000);
  if (sent.step && WHATSAPP_STEPS.includes(sent.step)) payload.step = sent.step;
  if (sent.variant === "A" || sent.variant === "B" || sent.variant === "C") payload.variant = sent.variant;
  if (typeof sent.edited === "boolean") payload.edited = sent.edited;
  return { payload, templateId: typeof sent.templateId === "string" && UUID.test(sent.templateId) ? sent.templateId : null };
}

export async function GET(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const gate = await requireGrowthMember();
  if ("error" in gate) return gate.error;
  const { id } = await params;
  const result = await getLeadDetail(gate.db, gate.actor, id);
  if (!result.ok) return serviceErrorToResponse(result.error);
  return NextResponse.json(result.data);
}

export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const gate = await requireGrowthMember();
  if ("error" in gate) return gate.error;
  const { id } = await params;
  const body = await readJson<LeadPatch>(request);
  if (!body) return NextResponse.json({ error: "Cuerpo inválido" }, { status: 400 });
  const { db, actor } = gate;

  if (body.outcome) {
    if (!OPERATOR_OUTCOMES.includes(body.outcome)) return NextResponse.json({ error: "Acción no válida" }, { status: 400 });
    const sent = body.outcome === "whatsapp_sent" ? sentPayload(body.sent) : { payload: {}, templateId: null };
    const payload: Record<string, unknown> = { ...sent.payload };
    if (body.outcome === "not_interested") payload.reason = body.reason === "competencia" ? "competencia" : "rechazo";
    // What the prospect answered, pasted by the operator, so the conversation reads both sides.
    if (body.outcome === "whatsapp_replied" && typeof body.reply === "string" && body.reply.trim()) payload.text = body.reply.trim().slice(0, 1000);
    const result = await recordOutcome(db, { leadId: id, outcome: body.outcome, actor: "operator", actorId: actor.userId, payload, templateId: sent.templateId });
    if (!result.ok) return serviceErrorToResponse(result.error);
    return NextResponse.json(result.data);
  }
  if (body.skip === true) {
    const result = await skipLead(db, actor, id);
    if (!result.ok) return serviceErrorToResponse(result.error);
    return NextResponse.json(result.data);
  }
  if (body.snoozeDays !== undefined) {
    const days = body.snoozeDays === null ? null : Math.min(Math.max(Math.round(body.snoozeDays), 1), 365);
    const result = await snoozeLead(db, actor, id, days);
    if (!result.ok) return serviceErrorToResponse(result.error);
    return NextResponse.json(result.data);
  }
  if (typeof body.phone === "string") {
    const result = await updateLeadPhone(db, actor, id, body.phone);
    if (!result.ok) return serviceErrorToResponse(result.error);
    return NextResponse.json(result.data);
  }
  if (typeof body.email === "string") {
    const result = await updateLeadEmail(db, actor, id, body.email);
    if (!result.ok) return serviceErrorToResponse(result.error);
    return NextResponse.json(result.data);
  }
  if (typeof body.giro === "string") {
    const result = await updateLeadGiro(db, actor, id, body.giro);
    if (!result.ok) return serviceErrorToResponse(result.error);
    return NextResponse.json(result.data);
  }
  return NextResponse.json({ error: "Nada que cambiar" }, { status: 400 });
}
