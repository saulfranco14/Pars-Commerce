import { NextResponse } from "next/server";

import { requireGrowthMember } from "@/app/api/growth/_lib";

import { serviceErrorToResponse } from "@/features/qr/services/serviceErrorToResponse";
import { myDay } from "@/features/growth/services/followUpService";

export async function GET() {
  const gate = await requireGrowthMember();
  if ("error" in gate) return gate.error;
  const result = await myDay(gate.db, gate.actor);
  if (!result.ok) return serviceErrorToResponse(result.error);
  return NextResponse.json(result.data);
}
