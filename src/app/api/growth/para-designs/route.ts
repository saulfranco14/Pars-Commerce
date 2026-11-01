import { NextResponse } from "next/server";

import { requireGrowthMember } from "@/app/api/growth/_lib";

import { serviceErrorToResponse } from "@/features/qr/services/serviceErrorToResponse";
import { paraDesignStats } from "@/features/growth/services/experimentService";

export async function GET() {
  const gate = await requireGrowthMember({ manage: true });
  if ("error" in gate) return gate.error;
  const result = await paraDesignStats(gate.db, gate.actor.workspaceId);
  if (!result.ok) return serviceErrorToResponse(result.error);
  return NextResponse.json(result.data);
}
