import { leadLinkSlug } from "@/features/growth/helpers/leadLinkToken";
import { renderTemplate } from "@/features/growth/helpers/renderTemplate";
import { buildTemplateVars } from "@/features/growth/helpers/templateVars";
import { validateTemplate } from "@/features/growth/helpers/validateTemplate";
import { internalError } from "@/features/growth/services/growthDb";

import type { GrowthDb } from "@/features/growth/services/growthDb";
import type { GrowthLead } from "@/features/growth/interfaces/lead";
import type {
  GrowthTemplate,
  TemplateChannel,
  TemplateDraft,
  TemplatePreview,
  TemplateStep,
  TemplateVariant,
} from "@/features/growth/interfaces/template";
import type { ServiceResult } from "@/features/qr/services/tablePaymentService";

const COLUMNS = "id, channel, giro, step, variant, version, subject, body, status, created_at";

export async function listTemplates(db: GrowthDb): Promise<ServiceResult<GrowthTemplate[]>> {
  const { data, error } = await db
    .from("growth_templates")
    .select(COLUMNS)
    .order("channel")
    .order("step")
    .order("variant")
    .order("version", { ascending: false })
    .limit(500);
  if (error) return internalError(error.message);
  return { ok: true, data: (data ?? []) as GrowthTemplate[] };
}

/** Active versions for a step: the giro-specific ones win over the generic ones. */
export async function activeTemplatePool(
  db: GrowthDb,
  input: { channel: TemplateChannel; step: TemplateStep; giro: string },
): Promise<GrowthTemplate[]> {
  const { data } = await db
    .from("growth_templates")
    .select(COLUMNS)
    .eq("channel", input.channel)
    .eq("step", input.step)
    .eq("status", "active")
    .or(`giro.is.null,giro.eq.${input.giro}`);
  const rows = (data ?? []) as GrowthTemplate[];
  const specific = rows.filter((row) => row.giro === input.giro);
  return (specific.length ? specific : rows.filter((row) => row.giro === null)).sort((a, b) => a.variant.localeCompare(b.variant));
}

/** A requested variant falls back to A; without one, variants rotate at random for the A/B split. */
export async function resolveTemplate(
  db: GrowthDb,
  input: { channel: TemplateChannel; step: TemplateStep; giro: string; variant?: TemplateVariant },
): Promise<GrowthTemplate | null> {
  const pool = await activeTemplatePool(db, input);
  if (!pool.length) return null;
  if (input.variant) return pool.find((row) => row.variant === input.variant) ?? pool.find((row) => row.variant === "A") ?? pool[0];
  return pool[Math.floor(Math.random() * pool.length)];
}

export function renderForLead(
  template: Pick<GrowthTemplate, "subject" | "body">,
  lead: Pick<GrowthLead, "business_name" | "giro" | "municipio" | "colonia" | "address">,
  extra: { link: string; firma: string; now?: Date },
): { subject: string | null; body: string } {
  const vars = buildTemplateVars(lead, extra);
  return {
    subject: template.subject ? renderTemplate(template.subject, vars) : null,
    body: renderTemplate(template.body, vars),
  };
}

export async function saveTemplateVersion(db: GrowthDb, draft: TemplateDraft, userId: string): Promise<ServiceResult<GrowthTemplate>> {
  const errors = validateTemplate(draft);
  if (errors.length) return { ok: false, error: { code: "validation", message: errors.join(" ") } };

  const { data, error } = await db.rpc("growth_save_template_version", {
    p_channel: draft.channel,
    p_giro: draft.giro,
    p_step: draft.step,
    p_variant: draft.variant,
    p_subject: draft.channel === "email" ? draft.subject?.trim() ?? null : null,
    p_body: draft.body.trim(),
    p_created_by: userId,
  });
  if (error) return internalError(error.message);
  return { ok: true, data: data as GrowthTemplate };
}

export async function setTemplateStatus(db: GrowthDb, id: string, status: "active" | "paused"): Promise<ServiceResult<GrowthTemplate>> {
  const { data, error } = await db
    .from("growth_templates")
    .update({ status })
    .eq("id", id)
    .neq("status", "archived")
    .select(COLUMNS)
    .maybeSingle();
  if (error) return internalError(error.message);
  if (!data) return { ok: false, error: { code: "not_found", message: "Esa versión ya está archivada." } };
  return { ok: true, data: data as GrowthTemplate };
}

/** Previews a draft against a real prospect of that giro (or any prospect) without saving. */
export async function previewTemplate(db: GrowthDb, draft: TemplateDraft, firma: string): Promise<ServiceResult<TemplatePreview>> {
  let query = db.from("growth_leads").select("business_name, giro, municipio, colonia, address").limit(1);
  if (draft.giro) query = query.eq("giro", draft.giro);
  const { data } = await query.maybeSingle();
  const lead = (data as Pick<GrowthLead, "business_name" | "giro" | "municipio" | "colonia" | "address"> | null) ?? {
    business_name: "Ferretería El Clavo",
    giro: draft.giro ?? "materiales",
    municipio: "Chimalhuacán",
    colonia: "Xochitenco",
    address: "Calle Hidalgo 12",
  };
  const rendered = renderForLead({ subject: draft.subject, body: draft.body }, lead, { link: `https://tlaco.app/para/${leadLinkSlug(lead.business_name)}-7Kq2Xm9aTzPb`, firma });
  return { ok: true, data: { ...rendered, leadName: lead.business_name } };
}
