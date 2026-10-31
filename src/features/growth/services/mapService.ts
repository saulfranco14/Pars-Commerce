import { rpcError } from "@/features/growth/services/growthDb";

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

/** «Ruta de hoy»: the closest prospects to visit from where the person stands. */
export async function nearbyLeads(db: GrowthDb, actor: GrowthActor, lat: number, lng: number): Promise<ServiceResult<NearbyLead[]>> {
  const { data, error } = await db.rpc("growth_nearby_leads", { p_lat: lat, p_lng: lng, p_limit: 8, p_workspace_id: actor.workspaceId, p_actor_id: actor.userId });
  if (error) return rpcError(error.message);
  return { ok: true, data: (data ?? []) as NearbyLead[] };
}
