import { internalError, rpcError } from "@/features/growth/services/growthDb";
import { applyLeadSearch } from "@/features/growth/services/leadService";

import type { GrowthDb } from "@/features/growth/services/growthDb";
import type { MapPoint, MapQuery, MapResult } from "@/features/growth/interfaces/map";
import type { GrowthActor } from "@/features/growth/interfaces/member";
import type { NearbyLead } from "@/features/growth/interfaces/lead";
import type { ServiceResult } from "@/features/qr/services/tablePaymentService";

/** Prospects inside the visible map box that this person may see; worked ones first. */
export async function mapPoints(db: GrowthDb, actor: GrowthActor, query: MapQuery): Promise<ServiceResult<MapResult>> {
  const { data, error } = await db.rpc("growth_map_points", {
    p_workspace_id: actor.workspaceId,
    p_actor_id: actor.userId,
    p_min_lat: query.minLat,
    p_min_lng: query.minLng,
    p_max_lat: query.maxLat,
    p_max_lng: query.maxLng,
    p_giro: query.giro ?? null,
    p_owner: query.owner ?? null,
    p_limit: 2000,
  });
  if (error) return rpcError(error.message);
  const rows = (data ?? []) as Array<MapPoint & { total: number }>;
  return { ok: true, data: { points: rows, total: Number(rows[0]?.total ?? 0) } };
}

const SEARCH_LIMIT = 8;

/** Prospects with a location that match a name or phone, so the map can fly to one that is off screen. */
export async function searchMapLeads(db: GrowthDb, actor: GrowthActor, q: string): Promise<ServiceResult<MapPoint[]>> {
  const base = db
    .from("growth_leads")
    .select("id, business_name, giro, municipio, colonia, lat, lng, stage, owner_user_id, phone_e164")
    .eq("workspace_id", actor.workspaceId)
    .not("lat", "is", null)
    .not("lng", "is", null);
  const scoped = actor.role === "prospector" ? base.or(`owner_user_id.eq.${actor.userId},owner_user_id.is.null`) : base;
  const { data, error } = await applyLeadSearch(scoped, q).order("business_name").limit(SEARCH_LIMIT);
  if (error) return internalError(error.message);
  const rows = (data ?? []) as Array<Omit<MapPoint, "has_phone"> & { phone_e164: string | null }>;
  return { ok: true, data: rows.map(({ phone_e164: phone, ...row }) => ({ ...row, has_phone: Boolean(phone) })) };
}

/** «Ruta de hoy»: the closest prospects to visit from where the person stands. */
export async function nearbyLeads(db: GrowthDb, actor: GrowthActor, lat: number, lng: number): Promise<ServiceResult<NearbyLead[]>> {
  const { data, error } = await db.rpc("growth_nearby_leads", { p_lat: lat, p_lng: lng, p_limit: 8, p_workspace_id: actor.workspaceId, p_actor_id: actor.userId });
  if (error) return rpcError(error.message);
  return { ok: true, data: (data ?? []) as NearbyLead[] };
}
