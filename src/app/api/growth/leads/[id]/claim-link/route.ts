import { NextResponse } from "next/server";

import { requireGrowthMember } from "@/app/api/growth/_lib";

import { serviceErrorToResponse } from "@/features/qr/services/serviceErrorToResponse";
import { inPersonRegistrationLink } from "@/features/growth/services/registrationService";

/** POST because it may mint the prospect's link the first time. */
export async function POST(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const gate = await requireGrowthMember();
  if ("error" in gate) return gate.error;
  const { id } = await params;
  const result = await inPersonRegistrationLink(gate.db, gate.actor, id);
  if (!result.ok) return serviceErrorToResponse(result.error);
  return NextResponse.json(result.data);
}
