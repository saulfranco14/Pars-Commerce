import { CLOSED_STAGES, LEADS_PAGE_SIZE } from "@/features/growth/constants/leadStages";
import { SWEEP_SKIP_HOURS, SWEEP_SKIPPED_KIND } from "@/features/growth/constants/sweep";
import { TEMPLATE_STEPS } from "@/features/growth/constants/templateVariables";
import { GIRO_COPY } from "@/features/growth/constants/giroCopy";
import { daysFromToday } from "@/features/growth/helpers/leadPipeline";
import { internalError, rpcError } from "@/features/growth/services/growthDb";
import { memberNames } from "@/features/growth/services/memberService";
import { nextAction } from "@/features/growth/services/nextActionService";
import { describeNextAction } from "@/features/growth/helpers/nextActionReason";
import { normalizeMexicanPhone } from "@/lib/phone";

import type { GrowthDb } from "@/features/growth/services/growthDb";
import type {
  ContactConflict,
  GrowthLead,
  LeadActor,
  LeadDetail,
  LeadEvent,
  LeadFilters,
  LeadListResult,
  LeadOutcome,
  LeadSourceDetail,
  LeadStage,
  NewLeadInput,
  NewLeadResult,
} from "@/features/growth/interfaces/lead";
import type { GrowthActor } from "@/features/growth/interfaces/member";
import type { GrowthTemplate } from "@/features/growth/interfaces/template";
import type { ServiceResult } from "@/features/qr/services/tablePaymentService";

export const LEAD_COLUMNS =
  "id, denue_id, business_name, giro, catalog_template_key, municipio, colonia, address, lat, lng, phone_e164, email, staff_range, phone_status, email_status, visit_status, stage, next_channel, whatsapp_attempts, visit_attempts, last_whatsapp_at, revisit_at, snoozed_until, drop_reason, registered_tenant_id, owner_user_id, owned_at, last_activity_at, created_at, next_step, next_step_at, next_step_note, appointment_at";

const SENT_OUTCOMES: LeadOutcome[] = ["whatsapp_sent", "email_sent"];
const SOURCE_DETAILS: LeadSourceDetail[] = ["visita", "referido", "redes", "otro"];
const NOT_FOUND = { ok: false, error: { code: "not_found", message: "El prospecto ya no existe." } } as const;

/** Every channel result goes through growth_record_outcome so state, cascade, suppressions and ownership stay atomic. */
export async function recordOutcome(
  db: GrowthDb,
  input: {
    leadId: string;
    outcome: LeadOutcome;
    actor: LeadActor;
    actorId?: string | null;
    payload?: Record<string, unknown>;
    revisitAt?: string | null;
    templateId?: string | null;
  },
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
    p_actor_id: input.actorId ?? null,
  });
  if (error) return rpcError(error.message);
  return { ok: true, data: data as GrowthLead };
}

/** Same rule the SQL functions apply: coordinators act on everything, prospectors on their own or unowned leads in their zones. */
export async function canActOn(db: GrowthDb, actor: GrowthActor, leadId: string): Promise<boolean> {
  const { data } = await db.rpc("growth_can_act_on", { p_lead_id: leadId, p_actor_id: actor.userId });
  return data === true;
}

function sanitizeSearch(value: string): string {
  return value.replace(/[%_,()*]/g, " ").trim().slice(0, 60);
}

type ListRow = GrowthLead & { growth_lead_links: Array<{ purpose: string; last_viewed_at: string | null }> | null };

function withParaView({ growth_lead_links: links, ...lead }: ListRow): GrowthLead {
  const views = (links ?? []).flatMap((link) => (link.purpose === "para" && link.last_viewed_at ? [link.last_viewed_at] : []));
  return { ...lead, para_viewed_at: views.sort().at(-1) ?? null };
}

/** A prospector only lists their own leads; a coordinator lists the workspace, optionally one person's. */
// eslint-disable-next-line @typescript-eslint/no-explicit-any -- the growth client is untyped (growthDb).
function scopeQuery(query: any, actor: GrowthActor, owner: string | undefined) {
  const scoped = query.eq("workspace_id", actor.workspaceId);
  const ownerId = actor.role === "prospector" || owner === "me" ? actor.userId : owner;
  if (ownerId === "none") return scoped.is("owner_user_id", null);
  return ownerId ? scoped.eq("owner_user_id", ownerId) : scoped;
}

export async function withOwnerNames(db: GrowthDb, workspaceId: string, leads: GrowthLead[]): Promise<GrowthLead[]> {
  const names = await memberNames(db, workspaceId, leads.map((lead) => lead.owner_user_id ?? ""));
  return leads.map((lead) => ({ ...lead, owner_name: lead.owner_user_id ? names[lead.owner_user_id] ?? null : null }));
}

export async function listLeads(db: GrowthDb, actor: GrowthActor, filters: LeadFilters): Promise<ServiceResult<LeadListResult>> {
  const page = Math.max(1, filters.page ?? 1);
  let query = scopeQuery(db.from("growth_leads").select(`${LEAD_COLUMNS}, growth_lead_links(purpose, last_viewed_at)`, { count: "exact" }), actor, filters.owner);
  if (filters.municipio) query = query.eq("municipio", filters.municipio);
  if (filters.giro) query = query.eq("giro", filters.giro);
  if (filters.stage === "en_lote") query = query.gt("reserved_until", new Date().toISOString()).neq("reserved_kind", SWEEP_SKIPPED_KIND);
  else if (filters.stage === "hoy") query = query.lt("next_step_at", daysFromToday(1, 0));
  else if (filters.stage === "activos" || !filters.stage) query = query.not("stage", "in", `(${CLOSED_STAGES.join(",")})`);
  else if (filters.stage !== "todos") query = query.eq("stage", filters.stage);
  if (filters.contact === "whatsapp" || filters.contact === "ambos") query = query.not("phone_e164", "is", null);
  if (filters.contact === "correo" || filters.contact === "ambos") query = query.not("email", "is", null);
  if (filters.contact === "sin") query = query.is("phone_e164", null).is("email", null);
  if (filters.channel) query = query.eq("next_channel", filters.channel);
  const term = filters.q ? sanitizeSearch(filters.q) : "";
  if (term.length >= 2) query = query.ilike("business_name", `%${term}%`);

  if (filters.stage === "hoy") query = query.order("next_step_at");
  const { data, error, count } = await query
    .order("last_activity_at", { ascending: false, nullsFirst: false })
    .order("business_name")
    .range((page - 1) * LEADS_PAGE_SIZE, page * LEADS_PAGE_SIZE - 1);
  if (error) return internalError(error.message);

  const head = { count: "exact", head: true };
  const base = () => scopeQuery(db.from("growth_leads").select("id", head), actor, filters.owner);
  const [total, contacted, conversing, registered, withPhone, withEmail] = await Promise.all([
    base(),
    base().in("stage", ["contactado", "conversando", "caliente", "sin_respuesta"]),
    base().in("stage", ["conversando", "caliente"]),
    base().eq("stage", "registrado"),
    base().not("phone_e164", "is", null),
    base().not("email", "is", null),
  ]);

  return {
    ok: true,
    data: {
      leads: await withOwnerNames(db, actor.workspaceId, ((data ?? []) as ListRow[]).map(withParaView)),
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

/** A prospector opens leads they can act on, plus the ones they once worked; anything else reads as missing. */
export async function getLeadDetail(db: GrowthDb, actor: GrowthActor, leadId: string): Promise<ServiceResult<LeadDetail>> {
  const [{ data: lead, error }, { data: events }, { data: acquisition }, canAct, action] = await Promise.all([
    db.from("growth_leads").select(LEAD_COLUMNS).eq("id", leadId).eq("workspace_id", actor.workspaceId).maybeSingle(),
    db.from("growth_lead_events").select("id, lead_id, type, channel, actor, actor_user_id, template_id, payload, created_at").eq("lead_id", leadId).order("created_at", { ascending: false }).limit(100),
    db.from("tenant_acquisitions").select("bucket, channel, tenant_id").eq("lead_id", leadId).maybeSingle(),
    canActOn(db, actor, leadId),
    nextAction(db, leadId),
  ]);
  if (error) return internalError(error.message);
  if (!lead) return NOT_FOUND;
  const rows = (events ?? []) as LeadEvent[];
  if (!canAct && !rows.some((event) => event.actor_user_id === actor.userId)) return NOT_FOUND;

  const names = await memberNames(db, actor.workspaceId, [lead.owner_user_id ?? "", ...rows.map((event) => event.actor_user_id ?? "")]);
  const named = rows.map((event) => ({ ...event, actor_name: event.actor_user_id ? names[event.actor_user_id] ?? null : null }));
  return {
    ok: true,
    data: {
      lead: { ...(lead as GrowthLead), owner_name: lead.owner_user_id ? names[lead.owner_user_id] ?? null : null },
      events: await labelTemplates(db, named),
      canAct,
      suggestion: action ? describeNextAction(action) : null,
      acquisition: acquisition ?? null,
    },
  };
}

async function labelTemplates(db: GrowthDb, events: LeadEvent[]): Promise<LeadEvent[]> {
  const ids = [...new Set(events.map((event) => event.template_id).filter((id): id is string => Boolean(id)))];
  if (!ids.length) return events;
  const { data } = await db.from("growth_templates").select("id, channel, step, variant, version").in("id", ids);
  const labels = new Map(((data ?? []) as Array<Pick<GrowthTemplate, "id" | "channel" | "step" | "variant" | "version">>).map((row) => {
    const step = TEMPLATE_STEPS[row.channel].find((item) => item.value === row.step)?.label ?? row.step;
    return [row.id, `${step} Â· ${row.variant}${row.version > 1 ? ` v${row.version}` : ""}`];
  }));
  return events.map((event) => ({ ...event, template_label: event.template_id ? labels.get(event.template_id) ?? null : null }));
}

export async function snoozeLead(db: GrowthDb, actor: GrowthActor, leadId: string, days: number | null): Promise<ServiceResult<GrowthLead>> {
  if (!(await canActOn(db, actor, leadId))) return NOT_FOUND;
  const until = days ? new Date(Date.now() + days * 86_400_000).toISOString() : null;
  const { data, error } = await db
    .from("growth_leads")
    .update({ snoozed_until: until, updated_at: new Date().toISOString() })
    .eq("id", leadId)
    .select(LEAD_COLUMNS)
    .maybeSingle();
  if (error) return internalError(error.message);
  if (!data) return NOT_FOUND;
  return { ok: true, data: data as GrowthLead };
}

/** "Later" from the sweep: keeps the card out of the sweep and Telegram batches for the rest of the day. */
export async function skipLead(db: GrowthDb, actor: GrowthActor, leadId: string): Promise<ServiceResult<{ id: string }>> {
  if (!(await canActOn(db, actor, leadId))) return NOT_FOUND;
  const until = new Date(Date.now() + SWEEP_SKIP_HOURS * 3_600_000).toISOString();
  const { data, error } = await db
    .from("growth_leads")
    .update({ reserved_until: until, reserved_kind: SWEEP_SKIPPED_KIND, reserved_by: actor.userId })
    .eq("id", leadId)
    .select("id")
    .maybeSingle();
  if (error) return internalError(error.message);
  if (!data) return NOT_FOUND;
  return { ok: true, data: { id: data.id as string } };
}

async function contactOwner(db: GrowthDb, workspaceId: string, phone: string | null, email: string | null): Promise<ContactConflict | null> {
  const { data } = await db.rpc("growth_contact_owner", { p_workspace_id: workspaceId, p_phone: phone, p_email: email });
  const row = (Array.isArray(data) ? data[0] : data) as { lead_id: string; owner_name: string | null; stage: LeadStage; since: string; suppressed: boolean } | undefined;
  return row ? { leadId: row.lead_id, ownerName: row.owner_name, stage: row.stage, since: row.since, suppressed: row.suppressed } : null;
}

function takenMessage(what: "telÃ©fono" | "correo", conflict: ContactConflict | null): string {
  if (!conflict?.ownerName) return `Ese ${what} ya es de otro prospecto.`;
  const since = new Intl.DateTimeFormat("es-MX", { day: "numeric", month: "short", timeZone: "America/Mexico_City" }).format(new Date(conflict.since));
  return `Ese ${what} ya lo trabaja ${conflict.ownerName} desde el ${since}.`;
}

/** Swaps in a better number (e.g. from Google Maps); the SQL side resets the WhatsApp state and the cascade. */
export async function updateLeadPhone(db: GrowthDb, actor: GrowthActor, leadId: string, rawPhone: string): Promise<ServiceResult<GrowthLead>> {
  const phone = normalizeMexicanPhone(rawPhone);
  if (!phone) return { ok: false, error: { code: "validation", message: "Escribe los 10 dÃ­gitos del telÃ©fono." } };
  const { data, error } = await db.rpc("growth_update_lead_phone", { p_lead_id: leadId, p_phone: phone, p_actor_id: actor.userId });
  if (error?.message.includes("PHONE_TAKEN")) {
    return { ok: false, error: { code: "conflict", message: takenMessage("telÃ©fono", await contactOwner(db, actor.workspaceId, phone, null)) } };
  }
  if (error) return rpcError(error.message);
  return { ok: true, data: data as GrowthLead };
}

export async function updateLeadEmail(db: GrowthDb, actor: GrowthActor, leadId: string, rawEmail: string): Promise<ServiceResult<GrowthLead>> {
  const email = rawEmail.trim().toLowerCase();
  const { data, error } = await db.rpc("growth_update_lead_email", { p_lead_id: leadId, p_email: email, p_actor_id: actor.userId });
  if (error?.message.includes("EMAIL_TAKEN")) {
    return { ok: false, error: { code: "conflict", message: takenMessage("correo", await contactOwner(db, actor.workspaceId, null, email)) } };
  }
  if (error) return rpcError(error.message);
  return { ok: true, data: data as GrowthLead };
}

/** The giro is also the starter catalog key, so fixing it changes what every "Para ti" link shows from now on. */
export async function updateLeadGiro(db: GrowthDb, actor: GrowthActor, leadId: string, giro: string): Promise<ServiceResult<GrowthLead>> {
  if (!GIRO_COPY[giro]) return { ok: false, error: { code: "validation", message: "Elige un giro de la lista." } };
  if (!(await canActOn(db, actor, leadId))) return NOT_FOUND;
  const { data: current, error: readError } = await db.from("growth_leads").select(LEAD_COLUMNS).eq("id", leadId).maybeSingle();
  if (readError) return internalError(readError.message);
  if (!current) return NOT_FOUND;
  if (current.giro === giro) return { ok: true, data: current as GrowthLead };

  const now = new Date().toISOString();
  const { data, error } = await db
    .from("growth_leads")
    .update({ giro, catalog_template_key: giro, last_activity_at: now, updated_at: now })
    .eq("id", leadId)
    .select(LEAD_COLUMNS)
    .maybeSingle();
  if (error) return internalError(error.message);
  await db.from("growth_lead_events").insert({ lead_id: leadId, type: "giro_corrected", actor: "operator", actor_user_id: actor.userId, payload: { previous: current.giro, giro } });
  return { ok: true, data: data as GrowthLead };
}

/** A prospect met outside the DENUE list: it belongs to whoever adds it, and a repeated phone or email is refused. */
export async function addLead(db: GrowthDb, actor: GrowthActor, input: NewLeadInput): Promise<ServiceResult<NewLeadResult>> {
  const name = input.business_name?.trim() ?? "";
  if (name.length < 2 || name.length > 160) return { ok: false, error: { code: "validation", message: "Escribe el nombre del negocio." } };
  const phone = input.phone?.trim() ? normalizeMexicanPhone(input.phone) : null;
  if (input.phone?.trim() && !phone) return { ok: false, error: { code: "validation", message: "Escribe los 10 dÃ­gitos del telÃ©fono." } };
  const email = input.email?.trim().toLowerCase() || null;
  if (!phone && !email) return { ok: false, error: { code: "validation", message: "Escribe al menos el telÃ©fono o el correo." } };
  if (!GIRO_COPY[input.giro]) return { ok: false, error: { code: "validation", message: "Elige un giro de la lista." } };
  if (!input.municipio?.trim()) return { ok: false, error: { code: "validation", message: "Escribe el municipio." } };

  const { data, error } = await db.rpc("growth_add_lead", {
    p_workspace_id: actor.workspaceId,
    p_actor_id: actor.userId,
    p_row: {
      business_name: name,
      phone_e164: phone,
      email,
      giro: input.giro,
      municipio: input.municipio.trim().slice(0, 80),
      colonia: input.colonia?.trim().slice(0, 80) || null,
      source_detail: SOURCE_DETAILS.includes(input.source_detail) ? input.source_detail : "otro",
      note: input.note?.trim().slice(0, 280) || null,
    },
  });
  if (error) return rpcError(error.message);
  const result = data as { status: string; lead_id?: string; owner_name?: string | null; stage?: LeadStage; since?: string; suppressed?: boolean };
  if (result.status === "conflict") {
    return {
      ok: true,
      data: {
        status: "conflict",
        conflict: { leadId: result.lead_id ?? "", ownerName: result.owner_name ?? null, stage: result.stage ?? "nuevo", since: result.since ?? "", suppressed: Boolean(result.suppressed) },
      },
    };
  }
  if (result.status === "suppressed") return { ok: true, data: { status: "suppressed" } };
  return { ok: true, data: { status: "created", leadId: result.lead_id ?? "" } };
}
