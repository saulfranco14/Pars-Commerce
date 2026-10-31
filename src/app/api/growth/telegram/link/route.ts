import { NextResponse } from "next/server";

import { requireGrowthMember } from "@/app/api/growth/_lib";

import { serviceErrorToResponse } from "@/features/qr/services/serviceErrorToResponse";
import { createLinkCode } from "@/features/growth/services/operatorService";

/** Each member links their own chat: alerts about their prospects go there. */
export async function POST() {
  const gate = await requireGrowthMember();
  if ("error" in gate) return gate.error;
  const result = await createLinkCode(gate.db, gate.actor);
  if (!result.ok) return serviceErrorToResponse(result.error);
  return NextResponse.json(result.data);
}
