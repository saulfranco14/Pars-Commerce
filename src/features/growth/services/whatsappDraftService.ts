import { buildWaLink } from "@/features/growth/helpers/buildWaLink";
import { suggestWhatsappStep } from "@/features/growth/helpers/suggestWhatsappStep";
import { internalError } from "@/features/growth/services/growthDb";
import { canActOn } from "@/features/growth/services/leadService";
import { createLeadLink, leadLinkUrl } from "@/features/growth/services/leadLinkService";
import { getSettings } from "@/features/growth/services/settingsService";
import { activeTemplatePool, renderForLead } from "@/features/growth/services/templateService";

import type { GrowthDb } from "@/features/growth/services/growthDb";
import type { GrowthLead } from "@/features/growth/interfaces/lead";
import type { GrowthActor } from "@/features/growth/interfaces/member";
import type { GrowthTemplate, TemplateVariant } from "@/features/growth/interfaces/template";
import type { WhatsappDraft, WhatsappStep } from "@/features/growth/interfaces/whatsapp";
import type { ServiceResult } from "@/features/qr/services/tablePaymentService";

type MessageLead = Pick<GrowthLead, "id" | "business_name" | "giro" | "municipio" | "colonia" | "address" | "phone_e164">;

const DRAFT_COLUMNS = "id, business_name, giro, municipio, colonia, address, phone_e164, stage, phone_status, whatsapp_attempts, last_whatsapp_at";

/** Template + fresh "Para ti" link + rendered text. Telegram cards and the Plataforma composer share it. */
export async function prepareWhatsappMessage(
  db: GrowthDb,
  lead: MessageLead,
  options: { step: WhatsappStep; firma: string; variant?: TemplateVariant; workspaceId?: string },
): Promise<{ template: GrowthTemplate; body: string; pool: GrowthTemplate[] } | null> {
  const pool = await activeTemplatePool(db, { channel: "whatsapp", step: options.step, giro: lead.giro, workspaceId: options.workspaceId });
  if (!pool.length) return null;
  const template = options.variant
    ? pool.find((row) => row.variant === options.variant) ?? pool[0]
    : pool[Math.floor(Math.random() * pool.length)];
  const token = await createLeadLink(db, { leadId: lead.id, purpose: "para", channel: "whatsapp", templateId: template.id, businessName: lead.business_name });
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

  const suggestion = suggestWhatsappStep(lead);
  const step = input.step ?? suggestion.step ?? "m1";
  const firma = actor.signature ?? (await getSettings(db, actor.workspaceId)).signature;
  const message = await prepareWhatsappMessage(db, lead, { step, firma, variant: input.variant, workspaceId: actor.workspaceId });
  if (!message) return { ok: false, error: { code: "validation", message: "No hay un mensaje activo para ese paso. Revisa Motor → Mensajes." } };

  return {
    ok: true,
    data: {
      step,
      variant: message.template.variant,
      version: message.template.version,
      templateId: message.template.id,
      body: message.body,
      waLink: buildWaLink(lead.phone_e164, message.body),
      variants: message.pool.map((row) => row.variant),
      suggestion,
    },
  };
}
