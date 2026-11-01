import { NextResponse } from "next/server";

import { requireGrowthMember } from "@/app/api/growth/_lib";

import { serviceErrorToResponse } from "@/features/qr/services/serviceErrorToResponse";
import { coldLeads } from "@/features/growth/services/cleanupService";

export async function GET(request: Request) {
  const gate = await requireGrowthMember();
  if ("error" in gate) return gate.error;
  const params = new URL(request.url).searchParams;
  const days = Math.min(Math.max(Number(params.get("days")) || 3, 1), 90);
  const owner = params.get("owner") || (gate.actor.role === "coordinador" ? undefined : "me");
  const result = await coldLeads(gate.db, gate.actor, { minDays: days, owner });
  if (!result.ok) return serviceErrorToResponse(result.error);
  return NextResponse.json(result.data);
}
