import { NextResponse } from "next/server";

import { requireGrowthMember } from "@/app/api/growth/_lib";

import { serviceErrorToResponse } from "@/features/qr/services/serviceErrorToResponse";
import { getFunnel } from "@/features/growth/services/funnelService";

export async function GET(request: Request) {
  const gate = await requireGrowthMember({ manage: true });
  if ("error" in gate) return gate.error;
  const days = Number(new URL(request.url).searchParams.get("days")) || 7;
  const result = await getFunnel(gate.db, gate.actor.workspaceId, days);
  if (!result.ok) return serviceErrorToResponse(result.error);
  return NextResponse.json(result.data);
}
