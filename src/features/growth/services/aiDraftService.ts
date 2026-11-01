import { generateText, GeminiError } from "@/lib/ai/gemini";
import { buildFollowUpPrompt, finishFollowUp } from "@/features/growth/helpers/aiFollowUpPrompt";
import { formatBusinessName } from "@/features/growth/helpers/formatBusinessName";
import { buildLeadSummary } from "@/features/growth/helpers/leadSummary";
import { greetingFor, mexicoHour } from "@/features/growth/helpers/templateVars";
import { giroCopy } from "@/features/growth/constants/giroCopy";
import { PARA_OBJECTION_LABEL, PARA_SECTION_LABEL } from "@/features/growth/constants/para";
import { zoneByMunicipio } from "@/features/growth/constants/zoneCopy";
import { internalError } from "@/features/growth/services/growthDb";
import { canActOn } from "@/features/growth/services/leadService";
import { ensureParaLink, leadLinkUrl } from "@/features/growth/services/leadLinkService";
import { getSettings } from "@/features/growth/services/settingsService";

import type { GrowthDb } from "@/features/growth/services/growthDb";
import type { AiDraft } from "@/features/growth/interfaces/aiDraft";
import type { GrowthLead, LeadEvent } from "@/features/growth/interfaces/lead";
import type { GrowthActor } from "@/features/growth/interfaces/member";
import type { ParaObjection, ParaSection } from "@/features/growth/interfaces/para";
import type { ServiceResult } from "@/features/qr/services/tablePaymentService";

const PREVIOUS_MESSAGES = 3;

/** A follow-up written by Gemini from the lead's own history; the operator reviews it before sending. */
export async function buildAiFollowUp(db: GrowthDb, actor: GrowthActor, leadId: string): Promise<ServiceResult<AiDraft>> {
  const [{ data: lead, error }, { data: events }] = await Promise.all([
    db.from("growth_leads").select("id, business_name, giro, municipio, colonia, phone_e164, stage").eq("id", leadId).eq("workspace_id", actor.workspaceId).maybeSingle(),
    db.from("growth_lead_events").select("id, type, actor, payload, created_at").eq("lead_id", leadId).order("created_at", { ascending: false }).limit(100),
  ]);
  if (error) return internalError(error.message);
  if (!lead || !(await canActOn(db, actor, leadId))) return { ok: false, error: { code: "not_found", message: "El prospecto ya no existe." } };
  const row = lead as Pick<GrowthLead, "id" | "business_name" | "giro" | "municipio" | "colonia" | "stage">;
  if (row.stage === "descartado") return { ok: false, error: { code: "validation", message: "Está dado de baja: no se le escribe." } };

  const history = (events ?? []) as LeadEvent[];
  const summary = buildLeadSummary(history);
  const sections = new Set<string>();
  for (const event of history) {
    if (event.type !== "para_left" || !Array.isArray(event.payload.sections)) continue;
    for (const section of event.payload.sections as ParaSection[]) if (PARA_SECTION_LABEL[section]) sections.add(PARA_SECTION_LABEL[section]);
  }
  const previousMessages = history
    .filter((event) => event.type === "whatsapp_sent" && typeof event.payload.body === "string")
    .slice(0, PREVIOUS_MESSAGES)
    .map((event) => String(event.payload.body));

  const businessName = formatBusinessName(row.business_name);
  const token = await ensureParaLink(db, { leadId, channel: "whatsapp", businessName: row.business_name });
  const signature = actor.signature ?? (await getSettings(db, actor.workspaceId)).signature;
  const context = {
    businessName,
    giro: giroCopy(row.giro).label,
    place: [row.colonia ? formatBusinessName(row.colonia) : null, zoneByMunicipio(row.municipio)?.label ?? row.municipio].filter(Boolean).join(", "),
    senderName: actor.displayName.split(" ")[0] ?? actor.displayName,
    signature,
    greeting: greetingFor(mexicoHour(new Date())),
    link: leadLinkUrl(token, "para"),
    sentCount: summary.sent,
    views: summary.views,
    averageSeconds: summary.averageSeconds,
    sections: [...sections],
    objection: summary.objection ? PARA_OBJECTION_LABEL[summary.objection as ParaObjection] ?? summary.objection : null,
    reply: summary.lastReply,
    claimClicked: summary.claimClicked,
    previousMessages,
  };

  try {
    const { system, prompt } = buildFollowUpPrompt(context);
    return { ok: true, data: { body: finishFollowUp(await generateText(system, prompt), context) } };
  } catch (err) {
    const message = err instanceof GeminiError ? err.message : "No pudimos escribir el mensaje con IA. Usa el sugerido.";
    console.error("[growth] AI follow-up failed", err);
    return { ok: false, error: { code: err instanceof GeminiError && err.status === 500 ? "internal" : "validation", message } };
  }
}
