import { GIRO_COPY, GIRO_KEYS, giroCopy } from "@/features/growth/constants/giroCopy";
import { ZONES, zoneByMunicipio, zoneBySlug } from "@/features/growth/constants/zoneCopy";
import { buildMapsLink, buildWaLink } from "@/features/growth/helpers/buildWaLink";
import { adBusinessName, adDefaultPlace } from "@/features/growth/helpers/prospectAds";
import { internalError } from "@/features/growth/services/growthDb";
import { ensureParaLink } from "@/features/growth/services/leadLinkService";
import { recordOutcome } from "@/features/growth/services/leadService";
import { zoneCountsFor } from "@/features/growth/services/prospectAdsService";
import { getSettings } from "@/features/growth/services/settingsService";
import { prepareWhatsappMessage } from "@/features/growth/services/whatsappDraftService";

import type { GrowthDb } from "@/features/growth/services/growthDb";
import type { GrowthLead, NearbyLead } from "@/features/growth/interfaces/lead";
import type { GrowthActor } from "@/features/growth/interfaces/member";
import type { MiniAppCard, MiniAppOutcome, MiniAppQueue, MiniAppRecentLead, MiniAppStop } from "@/features/growth/interfaces/miniApp";
import type { ServiceResult } from "@/features/qr/services/tablePaymentService";

const BATCH = 10;
const OUTCOME_PAYLOAD: Partial<Record<MiniAppOutcome, Record<string, string>>> = { not_interested: { reason: "rechazo" } };

function displayName(lead: Pick<GrowthLead, "business_name" | "giro">): string {
  return adBusinessName(lead.business_name, lead.giro) ?? `${giroCopy(lead.giro).label} sin nombre`;
}

async function cardFor(db: GrowthDb, lead: GrowthLead, firma: string, workspaceId: string): Promise<MiniAppCard | null> {
  if (!lead.phone_e164) return null;
  const message = await prepareWhatsappMessage(db, lead, { step: "m1", firma, workspaceId });
  if (!message) return null;
  const [token, zone] = await Promise.all([
    ensureParaLink(db, { leadId: lead.id, channel: "whatsapp", templateId: message.template.id, businessName: lead.business_name }),
    zoneCountsFor(db, { id: lead.id, lat: lead.lat, lng: lead.lng, giro: lead.giro, workspace_id: workspaceId }),
  ]);
  return {
    leadId: lead.id,
    businessName: displayName(lead),
    giroLabel: giroCopy(lead.giro).label,
    place: adDefaultPlace(lead.colonia, lead.municipio),
    variant: message.template.variant,
    body: message.body,
    waLink: buildWaLink(lead.phone_e164, message.body),
    token,
    nearby: zone?.within500 ?? null,
  };
}

async function cardsFor(db: GrowthDb, actor: GrowthActor, leads: GrowthLead[]): Promise<MiniAppCard[]> {
  const firma = actor.signature ?? (await getSettings(db, actor.workspaceId)).signature;
  const cards: MiniAppCard[] = [];
  // In order and one by one: each card mints or reuses a link and must not race the others.
  for (const lead of leads) {
    const card = await cardFor(db, lead, firma, actor.workspaceId);
    if (card) cards.push(card);
  }
  return cards;
}

const FILTERS = {
  zones: ZONES.map((zone) => ({ slug: zone.slug, label: zone.label })),
  giros: GIRO_KEYS.map((key) => ({ key, label: GIRO_COPY[key].label })),
};

/** What the operator already reserved and has not marked; reopening the app shows the same cards. */
export async function miniAppQueue(db: GrowthDb, actor: GrowthActor): Promise<ServiceResult<MiniAppQueue>> {
  const { data, error } = await db
    .from("growth_leads")
    .select("*")
    .eq("workspace_id", actor.workspaceId)
    .eq("reserved_by", actor.userId)
    .eq("reserved_kind", "whatsapp")
    .gt("reserved_until", new Date().toISOString())
    .order("reserved_until")
    .limit(BATCH * 2);
  if (error) return internalError(error.message);
  return { ok: true, data: { cards: await cardsFor(db, actor, (data ?? []) as GrowthLead[]), ...FILTERS } };
}

/** Ten more prospects with WhatsApp in the chosen zone and giro, reserved for this operator. */
export async function reserveMiniAppBatch(db: GrowthDb, actor: GrowthActor, input: { zone?: string | null; giro?: string | null }): Promise<ServiceResult<MiniAppQueue>> {
  const zone = input.zone ? zoneBySlug(input.zone) : undefined;
  const giro = input.giro && GIRO_KEYS.includes(input.giro) ? input.giro : null;
  const { error } = await db.rpc("growth_reserve_batch", {
    p_kind: "whatsapp",
    p_municipio: zone?.municipio ?? null,
    p_giro: giro,
    p_limit: BATCH,
    p_workspace_id: actor.workspaceId,
    p_actor_id: actor.userId,
  });
  if (error) return internalError(error.message);
  return miniAppQueue(db, actor);
}

export async function markMiniAppOutcome(db: GrowthDb, actor: GrowthActor, leadId: string, outcome: MiniAppOutcome): Promise<ServiceResult<{ leadId: string }>> {
  const result = await recordOutcome(db, { leadId, outcome, actor: "operator", actorId: actor.userId, payload: OUTCOME_PAYLOAD[outcome] ?? {} });
  if (!result.ok) return result;
  return { ok: true, data: { leadId } };
}

/** The prospects this operator wrote to lately: whose reply is the one just pasted. */
export async function recentlyMessaged(db: GrowthDb, actor: GrowthActor, limit = 8): Promise<MiniAppRecentLead[]> {
  let query = db
    .from("growth_leads")
    .select("id, business_name, giro, last_whatsapp_at")
    .eq("workspace_id", actor.workspaceId)
    .not("last_whatsapp_at", "is", null)
    .neq("stage", "descartado")
    .order("last_whatsapp_at", { ascending: false })
    .limit(limit);
  if (actor.role === "prospector") query = query.eq("owner_user_id", actor.userId);
  const { data } = await query;
  return ((data ?? []) as Array<{ id: string; business_name: string; giro: string; last_whatsapp_at: string | null }>).map((lead) => ({
    leadId: lead.id,
    businessName: displayName(lead),
    giroLabel: giroCopy(lead.giro).label,
    lastWhatsappAt: lead.last_whatsapp_at,
  }));
}

/** «Ruta»: the ten nearest prospects to visit from where the operator stands. */
export async function miniAppRoute(db: GrowthDb, actor: GrowthActor, lat: number, lng: number): Promise<ServiceResult<MiniAppStop[]>> {
  const { data, error } = await db.rpc("growth_nearby_leads", { p_lat: lat, p_lng: lng, p_limit: 10, p_workspace_id: actor.workspaceId, p_actor_id: actor.userId });
  if (error) return internalError(error.message);
  return {
    ok: true,
    data: ((data ?? []) as NearbyLead[]).map((lead) => ({
      leadId: lead.id,
      businessName: displayName(lead),
      giroLabel: giroCopy(lead.giro).label,
      address: [lead.address, lead.colonia, zoneByMunicipio(lead.municipio)?.label ?? lead.municipio].filter(Boolean).join(", "),
      distanceM: lead.distance_m,
      mapsUrl: buildMapsLink(lead.lat, lead.lng),
    })),
  };
}
