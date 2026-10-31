import { NextResponse } from "next/server";

import { requireGrowthMember } from "@/app/api/growth/_lib";

import { serviceErrorToResponse } from "@/features/qr/services/serviceErrorToResponse";
import { loadBoard } from "@/features/growth/services/followUpService";

export async function GET(request: Request) {
  const gate = await requireGrowthMember();
  if ("error" in gate) return gate.error;
  const params = new URL(request.url).searchParams;
  const result = await loadBoard(gate.db, gate.actor, {
    municipio: params.get("municipio")?.slice(0, 80) || undefined,
    giro: params.get("giro")?.slice(0, 40) || undefined,
    owner: params.get("owner")?.slice(0, 40) || undefined,
  });
  if (!result.ok) return serviceErrorToResponse(result.error);
  return NextResponse.json(result.data);
}
