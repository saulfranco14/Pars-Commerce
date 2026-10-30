import { NextResponse } from "next/server";

import { requireGrowthMember } from "@/app/api/growth/_lib";

import { serviceErrorToResponse } from "@/features/qr/services/serviceErrorToResponse";
import { nearbyLeads } from "@/features/growth/services/mapService";

export async function GET(request: Request) {
  const gate = await requireGrowthMember();
  if ("error" in gate) return gate.error;
  const params = new URL(request.url).searchParams;
  const lat = Number(params.get("lat"));
  const lng = Number(params.get("lng"));
  if (!Number.isFinite(lat) || !Number.isFinite(lng) || Math.abs(lat) > 90 || Math.abs(lng) > 180) return NextResponse.json({ error: "Ubicación inválida" }, { status: 400 });
  const result = await nearbyLeads(gate.db, gate.actor, lat, lng);
  if (!result.ok) return serviceErrorToResponse(result.error);
  return NextResponse.json(result.data);
}
