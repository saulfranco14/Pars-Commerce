import type { SupabaseClient } from "@supabase/supabase-js";

import { claimPath, leadCatalog } from "@/features/growth/helpers/claimLink";
import { internalError, rpcError } from "@/features/growth/services/growthDb";
import { canActOn, LEAD_COLUMNS } from "@/features/growth/services/leadService";
import { ensureParaLink } from "@/features/growth/services/leadLinkService";
import { notifyOperators } from "@/features/growth/services/operatorService";
import { escapeHtml } from "@/features/growth/services/telegramApi";
import { provisionAssistedOnboarding } from "@/features/onboarding/services/assistedOnboardingService";
import { getPublicAppUrl } from "@/lib/env/appUrl";
import { normalizeMexicanPhone } from "@/lib/phone";

import type { GrowthDb } from "@/features/growth/services/growthDb";
import type { GrowthLead, LeadRegistrationInput, LeadRegistrationResult } from "@/features/growth/interfaces/lead";
import type { GrowthActor } from "@/features/growth/interfaces/member";
import type { ServiceResult } from "@/features/qr/services/tablePaymentService";

const EMAIL = /^[^@\s]+@[^@\s]+\.[a-z]{2,}$/i;
const NOT_FOUND = { ok: false, error: { code: "not_found", message: "El prospecto ya no existe." } } as const;

async function loadWorkableLead(db: GrowthDb, actor: GrowthActor, leadId: string): Promise<GrowthLead | null> {
  const { data } = await db.from("growth_leads").select(LEAD_COLUMNS).eq("id", leadId).eq("workspace_id", actor.workspaceId).maybeSingle();
  if (!data || !(await canActOn(db, actor, leadId))) return null;
  return data as GrowthLead;
}

/** Registration done on the owner's own phone: /registro prefilled, credited to whoever works the prospect. */
export async function inPersonRegistrationLink(db: GrowthDb, actor: GrowthActor, leadId: string): Promise<ServiceResult<{ url: string }>> {
  const lead = await loadWorkableLead(db, actor, leadId);
  if (!lead) return NOT_FOUND;
  if (lead.stage === "registrado") return { ok: false, error: { code: "validation", message: "Este negocio ya se registró." } };
  const token = await ensureParaLink(db, { leadId, channel: "visita", businessName: lead.business_name });
  return { ok: true, data: { url: `${getPublicAppUrl()}${claimPath(lead, token)}` } };
}

/** Creates the business for its owner (invitation by email) and closes the prospect as registered by the team. */
export async function registerLeadBusiness(
  admin: SupabaseClient,
  db: GrowthDb,
  actor: GrowthActor,
  leadId: string,
  input: LeadRegistrationInput,
): Promise<ServiceResult<LeadRegistrationResult>> {
  const lead = await loadWorkableLead(db, actor, leadId);
  if (!lead) return NOT_FOUND;
  if (lead.stage === "registrado") return { ok: false, error: { code: "validation", message: "Este negocio ya se registró." } };
  const email = input.owner_email?.trim().toLowerCase() ?? "";
  if (!EMAIL.test(email)) return { ok: false, error: { code: "validation", message: "Escribe el correo del dueño: ahí le llega su acceso." } };
  const ownerName = input.owner_name?.trim() ?? "";
  if (ownerName.length < 2) return { ok: false, error: { code: "validation", message: "Escribe el nombre del dueño." } };
  const phone = input.owner_phone?.trim() ? normalizeMexicanPhone(input.owner_phone) : lead.phone_e164;
  if (input.owner_phone?.trim() && !phone) return { ok: false, error: { code: "validation", message: "Escribe los 10 dígitos de su teléfono." } };
  const businessName = input.business_name?.trim() || lead.business_name;

  const catalog = leadCatalog(lead);
  const provisioned = await provisionAssistedOnboarding(admin, actor.userId, {
    name: businessName,
    business_type: catalog?.businessType ?? lead.giro,
    catalog_template_key: catalog?.key ?? null,
    owner_name: ownerName,
    owner_email: email,
    owner_phone: phone?.slice(3) ?? undefined,
    billing_mode: "configuration_limited",
    notes: `Alta desde Prospección por ${actor.displayName}`,
  });
  if (!provisioned.ok) return provisioned;
  const tenantId = provisioned.data.tenant_id;
  if (!tenantId) return internalError("provision_assisted_tenant returned no tenant");

  const { error } = await db.rpc("growth_mark_registered", { p_lead_id: leadId, p_tenant_id: tenantId, p_actor_id: actor.userId });
  if (error) return rpcError(error.message);
  await notifyOperators(db, { text: `<b>Registro nuevo</b> · lo dio de alta ${escapeHtml(actor.displayName)}\n${escapeHtml(businessName)}` }, { workspaceId: actor.workspaceId, ownerId: lead.owner_user_id });

  return {
    ok: true,
    data: {
      tenantSlug: provisioned.data.tenant_slug,
      emailDelivery: provisioned.data.email_delivery,
      invitationUrl: provisioned.data.invitation_url,
      previewUrl: provisioned.data.preview_url,
    },
  };
}
