import { LEADS_PAGE_SIZE } from "@/features/growth/constants/leadStages";
import { TEMPLATE_STEPS } from "@/features/growth/constants/templateVariables";
import { GIRO_COPY } from "@/features/growth/constants/giroCopy";
import { internalError, rpcError } from "@/features/growth/services/growthDb";
import { normalizeMexicanPhone } from "@/lib/phone";

import type { GrowthDb } from "@/features/growth/services/growthDb";
import type { GrowthLead, LeadActor, LeadDetail, LeadEvent, LeadFilters, LeadListResult, LeadOutcome } from "@/features/growth/interfaces/lead";
import type { GrowthTemplate } from "@/features/growth/interfaces/template";
import type { ServiceResult } from "@/features/qr/services/tablePaymentService";

const LIST_COLUMNS =
  "id, denue_id, business_name, giro, catalog_template_key, municipio, colonia, address, lat, lng, phone_e164, email, staff_range, phone_status, email_status, visit_status, stage, next_channel, whatsapp_attempts, visit_attempts, last_whatsapp_at, revisit_at, snoozed_until, drop_reason, registered_tenant_id, last_activity_at, created_at";

const SENT_OUTCOMES: LeadOutcome[] = ["whatsapp_sent", "email_sent"];

/** Every channel result goes through growth_record_outcome so state, cascade and suppressions stay atomic. */
export async function recordOutcome(
  db: GrowthDb,
  input: { leadId: string; outcome: LeadOutcome; actor: LeadActor; payload?: Record<string, unknown>; revisitAt?: string | null; templateId?: string | null },
): Promise<ServiceResult<GrowthLead>> {
  let templateId = input.templateId ?? null;
  if (!templateId && SENT_OUTCOMES.includes(input.outcome)) {
    const { data } = await db
      .from("growth_lead_links")
      .select("template_id")
      .eq("lead_id", input.leadId)
      .eq("channel", input.outcome === "whatsapp_sent" ? "whatsapp" : "correo")
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle();
    templateId = (data?.template_id as string | null) ?? null;
  }

  const { data, error } = await db.rpc("growth_record_outcome", {
    p_lead_id: input.leadId,
    p_outcome: input.outcome,
    p_actor: input.actor,
    p_payload: input.payload ?? {},
    p_revisit_at: input.revisitAt ?? null,
    p_template_id: templateId,
  });
  if (error) return rpcError(error.message);
  return { ok: true, data: data as GrowthLead };
}

function sanitizeSearch(value: string): string {
  return value.replace(/[%_,()*]/g, " ").trim().slice(0, 60);
}

export async function listLeads(db: GrowthDb, filters: LeadFilters): Promise<ServiceResult<LeadListResult>> {
  const page = Math.max(1, filters.page ?? 1);
  let query = db.from("growth_leads").select(LIST_COLUMNS, { count: "exact" });
  if (filters.municipio) query = query.eq("municipio", filters.municipio);
  if (filters.giro) query = query.eq("giro", filters.giro);
  if (filters.stage === "en_lote") query = query.gt("reserved_until", new Date().toISOString());
  else if (filters.stage && filters.stage !== "todos") query = query.eq("stage", filters.stage);
  if (filters.contact === "whatsapp" || filters.contact === "ambos") query = query.not("phone_e164", "is", null);
  if (filters.contact === "correo" || filters.contact === "ambos") query = query.not("email", "is", null);
  if (filters.contact === "sin") query = query.is("phone_e164", null).is("email", null);
  if (filters.channel) query = query.eq("next_channel", filters.channel);
  const term = filters.q ? sanitizeSearch(filters.q) : "";
  if (term.length >= 2) query = query.ilike("business_name", `%${term}%`);

  const { data, error, count } = await query
    .order("last_activity_at", { ascending: false, nullsFirst: false })
    .order("business_name")
    .range((page - 1) * LEADS_PAGE_SIZE, page * LEADS_PAGE_SIZE - 1);
  if (error) return internalError(error.message);

  const head = { count: "exact", head: true };
  const [total, contacted, conversing, registered, withPhone, withEmail] = await Promise.all([
    db.from("growth_leads").select("id", head),
    db.from("growth_leads").select("id", head).in("stage", ["contactado", "conversando", "caliente", "sin_respuesta"]),
    db.from("growth_leads").select("id", head).in("stage", ["conversando", "caliente"]),
    db.from("growth_leads").select("id", head).eq("stage", "registrado"),
    db.from("growth_leads").select("id", head).not("phone_e164", "is", null),
    db.from("growth_leads").select("id", head).not("email", "is", null),
  ]);

  return {
    ok: true,
    data: {
      leads: (data ?? []) as GrowthLead[],
      total: count ?? 0,
      page,
      pageSize: LEADS_PAGE_SIZE,
      metrics: {
        total: total.count ?? 0,
        contacted: contacted.count ?? 0,
        conversing: conversing.count ?? 0,
        registered: registered.count ?? 0,
        withPhone: withPhone.count ?? 0,
        withEmail: withEmail.count ?? 0,
      },
    },
  };
}

export async function getLeadDetail(db: GrowthDb, leadId: string): Promise<ServiceResult<LeadDetail>> {
  const [{ data: lead, error }, { data: events }, { data: acquisition }] = await Promise.all([
    db.from("growth_leads").select(LIST_COLUMNS).eq("id", leadId).maybeSingle(),
    db.from("growth_lead_events").select("id, lead_id, type, channel, actor, template_id, payload, created_at").eq("lead_id", leadId).order("created_at", { ascending: false }).limit(100),
    db.from("tenant_acquisitions").select("bucket, channel, tenant_id").eq("lead_id", leadId).maybeSingle(),
  ]);
  if (error) return internalError(error.message);
  if (!lead) return { ok: false, error: { code: "not_found", message: "El prospecto ya no existe." } };
  return { ok: true, data: { lead: lead as GrowthLead, events: await labelTemplates(db, (events ?? []) as LeadEvent[]), acquisition: acquisition ?? null } };
}

async function labelTemplates(db: GrowthDb, events: LeadEvent[]): Promise<LeadEvent[]> {
  const ids = [...new Set(events.map((event) => event.template_id).filter((id): id is string => Boolean(id)))];
  if (!ids.length) return events;
  const { data } = await db.from("growth_templates").select("id, channel, step, variant, version").in("id", ids);
  const labels = new Map(((data ?? []) as Array<Pick<GrowthTemplate, "id" | "channel" | "step" | "variant" | "version">>).map((row) => {
    const step = TEMPLATE_STEPS[row.channel].find((item) => item.value === row.step)?.label ?? row.step;
    return [row.id, `${step} · ${row.variant}${row.version > 1 ? ` v${row.version}` : ""}`];
  }));
  return events.map((event) => ({ ...event, template_label: event.template_id ? labels.get(event.template_id) ?? null : null }));
}

export async function snoozeLead(db: GrowthDb, leadId: string, days: number | null): Promise<ServiceResult<GrowthLead>> {
  const until = days ? new Date(Date.now() + days * 86_400_000).toISOString() : null;
  const { data, error } = await db
    .from("growth_leads")
    .update({ snoozed_until: until, updated_at: new Date().toISOString() })
    .eq("id", leadId)
    .select(LIST_COLUMNS)
    .maybeSingle();
  if (error) return internalError(error.message);
  if (!data) return { ok: false, error: { code: "not_found", message: "El prospecto ya no existe." } };
  return { ok: true, data: data as GrowthLead };
}

/** Swaps in a better number (e.g. from Google Maps); the SQL side resets the WhatsApp state and the cascade. */
export async function updateLeadPhone(db: GrowthDb, leadId: string, rawPhone: string): Promise<ServiceResult<GrowthLead>> {
  const phone = normalizeMexicanPhone(rawPhone);
  if (!phone) return { ok: false, error: { code: "validation", message: "Escribe los 10 dígitos del teléfono." } };
  const { data, error } = await db.rpc("growth_update_lead_phone", { p_lead_id: leadId, p_phone: phone });
  if (error) return rpcError(error.message);
  return { ok: true, data: data as GrowthLead };
}

/** The giro is also the starter catalog key, so fixing it changes what every "Para ti" link shows from now on. */
export async function updateLeadGiro(db: GrowthDb, leadId: string, giro: string): Promise<ServiceResult<GrowthLead>> {
  if (!GIRO_COPY[giro]) return { ok: false, error: { code: "validation", message: "Elige un giro de la lista." } };
  const { data: current, error: readError } = await db.from("growth_leads").select(LIST_COLUMNS).eq("id", leadId).maybeSingle();
  if (readError) return internalError(readError.message);
  if (!current) return { ok: false, error: { code: "not_found", message: "El prospecto ya no existe." } };
  if (current.giro === giro) return { ok: true, data: current as GrowthLead };

  const now = new Date().toISOString();
  const { data, error } = await db
    .from("growth_leads")
    .update({ giro, catalog_template_key: giro, last_activity_at: now, updated_at: now })
    .eq("id", leadId)
    .select(LIST_COLUMNS)
    .maybeSingle();
  if (error) return internalError(error.message);
  await db.from("growth_lead_events").insert({ lead_id: leadId, type: "giro_corrected", actor: "operator", payload: { previous: current.giro, giro } });
  return { ok: true, data: data as GrowthLead };
}
