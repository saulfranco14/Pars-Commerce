import { NextResponse } from "next/server";

import { requireGrowthMember } from "@/app/api/growth/_lib";

import { serviceErrorToResponse } from "@/features/qr/services/serviceErrorToResponse";
import { buildAiFollowUp } from "@/features/growth/services/aiDraftService";

type Params = { params: Promise<{ id: string }> };

export async function POST(_request: Request, { params }: Params) {
  const gate = await requireGrowthMember();
  if ("error" in gate) return gate.error;
  const result = await buildAiFollowUp(gate.db, gate.actor, (await params).id);
  if (!result.ok) return serviceErrorToResponse(result.error);
  return NextResponse.json(result.data);
}
