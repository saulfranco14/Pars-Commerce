import { NextResponse } from "next/server";

import { requireGrowthMember } from "@/app/api/growth/_lib";

import { serviceErrorToResponse } from "@/features/qr/services/serviceErrorToResponse";
import { mapPoints } from "@/features/growth/services/mapService";

function coordinate(params: URLSearchParams, key: string): number | null {
  const value = Number(params.get(key));
  return params.get(key) !== null && Number.isFinite(value) ? value : null;
}

export async function GET(request: Request) {
  const gate = await requireGrowthMember();
  if ("error" in gate) return gate.error;
  const params = new URL(request.url).searchParams;
  const [minLat, minLng, maxLat, maxLng] = ["minLat", "minLng", "maxLat", "maxLng"].map((key) => coordinate(params, key));
  if (minLat === null || minLng === null || maxLat === null || maxLng === null) return NextResponse.json({ error: "Faltan los límites del mapa" }, { status: 400 });
  const result = await mapPoints(gate.db, gate.actor, {
    minLat,
    minLng,
    maxLat,
    maxLng,
    giro: params.get("giro")?.slice(0, 40) || undefined,
    owner: params.get("owner")?.slice(0, 40) || undefined,
  });
  if (!result.ok) return serviceErrorToResponse(result.error);
  return NextResponse.json(result.data);
}
