import { AD_KINDS, ZONE_FIRST_IDEA, giroAdCopy } from "@/features/growth/constants/prospectAds";
import { giroCopy } from "@/features/growth/constants/giroCopy";
import { adBusinessName, adDefaultPlace } from "@/features/growth/helpers/prospectAds";
import { findLinkLead } from "@/features/growth/services/leadLinkService";
import { loadAdLead, zoneCountsFor } from "@/features/growth/services/prospectAdsService";

import type { GrowthDb } from "@/features/growth/services/growthDb";
import type { ProspectWelcome } from "@/features/growth/interfaces/paraAds";
import type { ZonePoint, ZoneReport } from "@/features/growth/interfaces/zoneReport";
import type { AdLead } from "@/features/growth/services/prospectAdsService";

interface SignupMetadata {
  registration_intent?: { tenant_id?: string; prospect_token?: string | null };
}

/** The prospect a business came from; attribution runs after signup, so the token covers the first seconds. */
export async function tenantProspectLead(db: GrowthDb, tenantId: string, metadata: SignupMetadata | null | undefined): Promise<AdLead | null> {
  const { data } = await db.from("tenant_acquisitions").select("lead_id").eq("tenant_id", tenantId).maybeSingle();
  let leadId = (data?.lead_id as string | null | undefined) ?? null;
  const intent = metadata?.registration_intent;
  if (!leadId && intent?.tenant_id === tenantId && intent.prospect_token) {
    // The link is revoked only by «Quitar mis datos»; a registered business keeps reading its own lead.
    leadId = (await findLinkLead(db, intent.prospect_token, "para"))?.leadId ?? null;
  }
  return leadId ? loadAdLead(db, leadId) : null;
}

export async function prospectWelcome(db: GrowthDb, lead: AdLead): Promise<ProspectWelcome> {
  const zone = await zoneCountsFor(db, lead);
  return {
    displayName: adBusinessName(lead.business_name, lead.giro),
    kinds: AD_KINDS,
    zone: zone ? { within500: zone.within500, plural: giroCopy(lead.giro).plural } : null,
  };
}

export async function zoneReport(db: GrowthDb, lead: AdLead): Promise<ZoneReport | null> {
  if (lead.lat == null || lead.lng == null) return null;
  const [counts, points] = await Promise.all([
    zoneCountsFor(db, lead),
    db.rpc("growth_zone_points", { p_lat: lead.lat, p_lng: lead.lng, p_giro: lead.giro, p_exclude: lead.id, p_workspace_id: lead.workspace_id }),
  ]);
  if (!counts) return null;
  return {
    giroLabel: giroCopy(lead.giro).label,
    plural: giroCopy(lead.giro).plural,
    place: adDefaultPlace(lead.colonia, lead.municipio),
    center: { lat: lead.lat, lng: lead.lng },
    within500: counts.within500,
    within1000: counts.within1000,
    nearestM: counts.nearestM,
    points: ((points.data ?? []) as ZonePoint[]).filter((point) => point.distance_m <= 1000),
    ideas: [
      ZONE_FIRST_IDEA,
      { title: "Una prueba de una semana", action: giroAdCopy(lead.giro).slowIdea, test: "Prueba: anote cuánto vende esa semana; si vende más, la deja." },
    ],
  };
}
