import { AD_BACKGROUND_BUCKET } from "@/features/growth/constants/prospectAds";
import { adFieldValues, buildLeadAds, pickBackground, sanitizeAdEdits } from "@/features/growth/helpers/prospectAds";
import { hashPreviewToken } from "@/features/preview/previewLinks";
import { internalError } from "@/features/growth/services/growthDb";
import { findLinkLead } from "@/features/growth/services/leadLinkService";

import type { GrowthDb } from "@/features/growth/services/growthDb";
import type { AdBackgroundKind, AdContent, AdEdit, AdEdits, AdKind, LeadAdsSource } from "@/features/growth/interfaces/prospectAds";
import type { ServiceResult } from "@/features/qr/services/tablePaymentService";

export const AD_LEAD_COLUMNS = "id, business_name, giro, colonia, municipio, address, lat, lng, ad_edits, ad_seed, workspace_id, owner_user_id, phone_e164, stage";

export interface AdLead {
  id: string;
  business_name: string;
  giro: string;
  colonia: string | null;
  municipio: string;
  address: string | null;
  lat: number | null;
  lng: number | null;
  ad_edits: AdEdits;
  ad_seed: number;
  workspace_id: string;
  owner_user_id: string | null;
  phone_e164: string | null;
  stage: string;
}

export interface LeadAds {
  lead: AdLead;
  ads: AdContent[];
  values: Record<AdKind, Required<AdEdit>>;
}

export interface ZoneCounts {
  within500: number;
  within1000: number;
  nearestM: number | null;
}

/** The bucket is public: the URL is built, not signed. */
export function adBackgroundUrl(storagePath: string): string {
  const base = (process.env.NEXT_PUBLIC_SUPABASE_URL ?? "").replace(/\/$/, "");
  return `${base}/storage/v1/object/public/${AD_BACKGROUND_BUCKET}/${storagePath.split("/").map(encodeURIComponent).join("/")}`;
}

/** Approved backgrounds of a giro, as public URLs, oldest first so a lead keeps its pick. */
export async function approvedBackgrounds(db: GrowthDb, giro: string): Promise<Record<AdBackgroundKind, string[]>> {
  const { data } = await db.from("growth_ad_backgrounds").select("kind, storage_path").eq("giro", giro).eq("status", "approved").order("created_at");
  const urls: Record<AdBackgroundKind, string[]> = { giro: [], producto: [] };
  for (const row of (data ?? []) as Array<{ kind: AdBackgroundKind; storage_path: string }>) urls[row.kind].push(adBackgroundUrl(row.storage_path));
  return urls;
}

/** What the four ads are drawn from: the lead, its edits and the backgrounds it got. */
export async function adSourceFor(db: GrowthDb, lead: AdLead): Promise<LeadAdsSource> {
  const backgrounds = await approvedBackgrounds(db, lead.giro);
  return {
    businessName: lead.business_name,
    giro: lead.giro,
    colonia: lead.colonia,
    municipio: lead.municipio,
    edits: sanitizeAdEdits(lead.ad_edits),
    backgrounds: {
      giro: pickBackground(backgrounds.giro, lead.id, lead.ad_seed),
      producto: pickBackground(backgrounds.producto, `${lead.id}:producto`, lead.ad_seed),
    },
  };
}

export async function adsForLead(db: GrowthDb, lead: AdLead): Promise<LeadAds> {
  const source = await adSourceFor(db, lead);
  return { lead: { ...lead, ad_edits: source.edits }, ads: buildLeadAds(source), values: adFieldValues(source) };
}

export async function loadAdLead(db: GrowthDb, leadId: string): Promise<AdLead | null> {
  const { data } = await db.from("growth_leads").select(AD_LEAD_COLUMNS).eq("id", leadId).maybeSingle();
  return (data as AdLead | null) ?? null;
}

/** The ads behind a public «Para ti» link; null when the link expired or was removed. */
export async function leadAdsByToken(db: GrowthDb, token: string): Promise<LeadAds | null> {
  const link = await findLinkLead(db, token, "para");
  if (!link) return null;
  const lead = await loadAdLead(db, link.leadId);
  return lead ? adsForLead(db, lead) : null;
}

/** Saves what the owner typed in one ad; the page is public, so only known fields survive. */
export async function saveAdEdits(db: GrowthDb, token: string, kind: AdKind, raw: unknown): Promise<ServiceResult<LeadAds>> {
  const current = await leadAdsByToken(db, token);
  if (!current) return { ok: false, error: { code: "not_found", message: "Este enlace ya no está disponible." } };
  const incoming = sanitizeAdEdits({ [kind]: raw })[kind] ?? {};
  const merged = sanitizeAdEdits({ ...current.lead.ad_edits, [kind]: { ...current.lead.ad_edits[kind], ...incoming } });
  const { error } = await db.from("growth_leads").update({ ad_edits: merged, updated_at: new Date().toISOString() }).eq("id", current.lead.id);
  if (error) return internalError(error.message);
  return { ok: true, data: await adsForLead(db, { ...current.lead, ad_edits: merged }) };
}

/** Operator side: the prospect's price from a WhatsApp reply goes into the product ad. */
export async function setLeadAdPrice(db: GrowthDb, leadId: string, kind: "promo" | "prod", price: string): Promise<void> {
  const lead = await loadAdLead(db, leadId);
  if (!lead) return;
  const edits = sanitizeAdEdits(lead.ad_edits);
  const merged = sanitizeAdEdits({ ...edits, [kind]: { ...edits[kind], price } });
  await db.from("growth_leads").update({ ad_edits: merged, updated_at: new Date().toISOString() }).eq("id", leadId);
}

/** «Otro»: the next approved backgrounds for this prospect. */
export async function nextLeadBackground(db: GrowthDb, leadId: string): Promise<ServiceResult<{ seed: number }>> {
  const lead = await loadAdLead(db, leadId);
  if (!lead) return { ok: false, error: { code: "not_found", message: "El prospecto ya no existe." } };
  const seed = lead.ad_seed + 1;
  const { error } = await db.from("growth_leads").update({ ad_seed: seed }).eq("id", leadId);
  if (error) return internalError(error.message);
  return { ok: true, data: { seed } };
}

/** Same-giro businesses around the prospect; null without a location. */
export async function zoneCountsFor(db: GrowthDb, lead: Pick<AdLead, "id" | "lat" | "lng" | "giro" | "workspace_id">): Promise<ZoneCounts | null> {
  if (lead.lat == null || lead.lng == null) return null;
  const { data, error } = await db.rpc("growth_zone_counts", { p_lat: lead.lat, p_lng: lead.lng, p_giro: lead.giro, p_exclude: lead.id, p_workspace_id: lead.workspace_id });
  if (error) return null;
  const row = (Array.isArray(data) ? data[0] : data) as { within_500: number; within_1000: number; nearest_m: number | null } | undefined;
  return row ? { within500: row.within_500 ?? 0, within1000: row.within_1000 ?? 0, nearestM: row.nearest_m ?? null } : null;
}

export async function removeProspectData(db: GrowthDb, token: string): Promise<{ leadId: string; businessName: string; municipio: string; workspaceId: string; ownerId: string | null } | null> {
  const { data, error } = await db.rpc("growth_remove_prospect_data", { p_token_hash: hashPreviewToken(token) });
  if (error) throw new Error(error.message);
  const row = (Array.isArray(data) ? data[0] : data) as { lead_id: string; business_name: string; municipio: string; workspace_id: string; owner_user_id: string | null } | undefined;
  return row ? { leadId: row.lead_id, businessName: row.business_name, municipio: row.municipio, workspaceId: row.workspace_id, ownerId: row.owner_user_id } : null;
}
