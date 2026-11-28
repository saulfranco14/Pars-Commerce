import { NextResponse } from "next/server";

import { serviceErrorToResponse } from "@/features/qr/services/serviceErrorToResponse";
import { requireMiniAppActor } from "@/features/growth/services/miniAppGate";
import { miniAppRoute } from "@/features/growth/services/miniAppService";

/** «Ruta»: the ten nearest prospects to visit. */
export async function GET(request: Request) {
  const gate = await requireMiniAppActor(request);
  if ("error" in gate) return gate.error;
  const params = new URL(request.url).searchParams;
  const lat = Number(params.get("lat"));
  const lng = Number(params.get("lng"));
  if (!Number.isFinite(lat) || !Number.isFinite(lng) || Math.abs(lat) > 90 || Math.abs(lng) > 180) {
    return NextResponse.json({ error: "No llegó tu ubicación." }, { status: 400 });
  }
  const result = await miniAppRoute(gate.db, gate.actor, lat, lng);
  if (!result.ok) return serviceErrorToResponse(result.error);
  return NextResponse.json(result.data);
}
