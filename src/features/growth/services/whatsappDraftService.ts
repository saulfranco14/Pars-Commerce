import { describeNextAction } from "@/features/growth/helpers/nextActionReason";
import { pickVariant } from "@/features/growth/helpers/pickVariant";
import { internalError } from "@/features/growth/services/growthDb";
import { canActOn } from "@/features/growth/services/leadService";
import { ensureParaLink, leadLinkUrl } from "@/features/growth/services/leadLinkService";
import { getSettings } from "@/features/growth/services/settingsService";
import { activeTemplatePool, renderForLead } from "@/features/growth/services/templateService";

import type { GrowthDb } from "@/features/growth/services/growthDb";
import type { GrowthLead } from "@/features/growth/interfaces/lead";
import type { GrowthActor } from "@/features/growth/interfaces/member";
import type { GrowthTemplate, TemplateVariant } from "@/features/growth/interfaces/template";
import type { NextAction, WhatsappDraft, WhatsappStep } from "@/features/growth/interfaces/whatsapp";
import type { ServiceResult } from "@/features/qr/services/tablePaymentService";

type MessageLead = Pick<GrowthLead, "id" | "business_name" | "giro" | "municipio" | "colonia" | "address" | "phone_e164">;

const DRAFT_COLUMNS = "id, business_name, giro, municipio, colonia, address, phone_e164, stage, phone_status, whatsapp_attempts, last_whatsapp_at";

/** Which message fits now and the facts behind it; the decision lives in growth_lead_next_action. */
export async function nextAction(db: GrowthDb, leadId: string): Promise<NextAction | null> {
  const { data } = await db.rpc("growth_lead_next_action", { p_lead_id: leadId });
  return (data as NextAction | null) ?? null;
}

/**
 * Template + the lead's "Para ti" link + rendered text. Telegram cards and the composer share it.
 * The variant is never random: the requested one, else one this lead has not received for the step.
 */
export async function prepareWhatsappMessage(
  db: GrowthDb,
  lead: MessageLead,
  options: { step: WhatsappStep; firma: string; variant?: TemplateVariant; sentVariants?: string[]; workspaceId?: string },
): Promise<{ template: GrowthTemplate; body: string; pool: GrowthTemplate[] } | null> {
  const pool = await activeTemplatePool(db, { channel: "whatsapp", step: options.step, giro: lead.giro, workspaceId: options.workspaceId });
  const variant = pickVariant(pool.map((row) => row.variant), { requested: options.variant, sent: options.sentVariants ?? [], seed: lead.id });
  const template = pool.find((row) => row.variant === variant);
  if (!template) return null;
  const token = await ensureParaLink(db, { leadId: lead.id, channel: "whatsapp", templateId: template.id, businessName: lead.business_name });
  const { body } = renderForLead(template, lead, { link: leadLinkUrl(token, "para"), firma: options.firma });
  return { template, body, pool };
}

export async function buildWhatsappDraft(
  db: GrowthDb,
  actor: GrowthActor,
  leadId: string,
  input: { step?: WhatsappStep; variant?: TemplateVariant },
): Promise<ServiceResult<WhatsappDraft>> {
  const { data, error } = await db.from("growth_leads").select(DRAFT_COLUMNS).eq("id", leadId).eq("workspace_id", actor.workspaceId).maybeSingle();
  if (error) return internalError(error.message);
  if (!data || !(await canActOn(db, actor, leadId))) return { ok: false, error: { code: "not_found", message: "El prospecto ya no existe." } };
  const lead = data as GrowthLead;
  if (!lead.phone_e164) return { ok: false, error: { code: "validation", message: "Este negocio no tiene teléfono." } };

  const action = await nextAction(db, leadId);
  if (!action) return internalError("growth_lead_next_action returned nothing");
  const step = input.step ?? action.step ?? "m1";
  const sentVariants = action.facts.sent.filter((message) => message.step === step).flatMap((message) => (message.variant ? [message.variant] : []));
  const firma = actor.signature ?? (await getSettings(db, actor.workspaceId)).signature;
  const message = await prepareWhatsappMessage(db, lead, { step, firma, variant: input.variant, sentVariants, workspaceId: actor.workspaceId });
  if (!message) return { ok: false, error: { code: "validation", message: "No hay un mensaje activo para ese paso. Revisa Motor → Mensajes." } };

  return {
    ok: true,
    data: {
      step,
      variant: message.template.variant,
      version: message.template.version,
      templateId: message.template.id,
      body: message.body,
      phone: lead.phone_e164,
      variants: message.pool.map((row) => row.variant),
      suggestion: describeNextAction(action),
    },
  };
}
