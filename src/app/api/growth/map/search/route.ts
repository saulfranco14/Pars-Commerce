import { NextResponse } from "next/server";

import { requireGrowthMember } from "@/app/api/growth/_lib";

import { serviceErrorToResponse } from "@/features/qr/services/serviceErrorToResponse";
import { searchMapLeads } from "@/features/growth/services/mapService";

export async function GET(request: Request) {
  const gate = await requireGrowthMember();
  if ("error" in gate) return gate.error;
  const q = new URL(request.url).searchParams.get("q")?.trim().slice(0, 60) ?? "";
  if (q.length < 2) return NextResponse.json([]);
  const result = await searchMapLeads(gate.db, gate.actor, q);
  if (!result.ok) return serviceErrorToResponse(result.error);
  return NextResponse.json(result.data);
}
