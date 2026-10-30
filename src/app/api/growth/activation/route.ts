import { NextResponse } from "next/server";

import { requireGrowthMember } from "@/app/api/growth/_lib";

import { serviceErrorToResponse } from "@/features/qr/services/serviceErrorToResponse";
import { activationBoard } from "@/features/growth/services/followUpService";

export async function GET(request: Request) {
  const gate = await requireGrowthMember();
  if ("error" in gate) return gate.error;
  const owner = new URL(request.url).searchParams.get("owner")?.slice(0, 40) || undefined;
  const result = await activationBoard(gate.db, gate.actor, owner);
  if (!result.ok) return serviceErrorToResponse(result.error);
  return NextResponse.json(result.data);
}
