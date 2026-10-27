import { findLinkLead } from "@/features/growth/services/leadLinkService";

import type { GrowthDb } from "@/features/growth/services/growthDb";
import type { ProspectPrefill } from "@/features/growth/interfaces/prefill";

const EMPTY: ProspectPrefill = { pickupPoint: null };

interface PrefillLead {
  business_name: string;
  address: string | null;
  colonia: string | null;
  municipio: string;
  postal_code: string | null;
  lat: number | null;
  lng: number | null;
}

async function resolveLeadId(db: GrowthDb, tenantId: string, prospectToken: string | null): Promise<string | null> {
  const { data } = await db.from("tenant_acquisitions").select("lead_id").eq("tenant_id", tenantId).maybeSingle();
  if (data?.lead_id) return data.lead_id as string;
  // Attribution runs after the signup response, so the token covers the first seconds.
  return prospectToken ? (await findLinkLead(db, prospectToken, "para"))?.leadId ?? null : null;
}

/** Never throws: without growth data the setup simply asks as usual. */
export async function getProspectPrefill(db: GrowthDb, input: { tenantId: string; prospectToken: string | null }): Promise<ProspectPrefill> {
  try {
    const leadId = await resolveLeadId(db, input.tenantId, input.prospectToken);
    if (!leadId) return EMPTY;
    const { data } = await db
      .from("growth_leads")
      .select("business_name, address, colonia, municipio, postal_code, lat, lng")
      .eq("id", leadId)
      .maybeSingle();
    const lead = data as PrefillLead | null;
    if (!lead?.address) return EMPTY;
    const addressText = [lead.address, lead.colonia, [lead.postal_code, lead.municipio].filter(Boolean).join(" "), "Estado de México"].filter(Boolean).join(", ");
    return {
      pickupPoint: {
        name: lead.business_name,
        address_text: addressText,
        reference: "",
        instructions: "",
        mapbox_feature_id: null,
        latitude: lead.lat,
        longitude: lead.lng,
        business_hours: null,
      },
    };
  } catch (error) {
    console.error("[growth] prospect prefill failed:", error);
    return EMPTY;
  }
}
