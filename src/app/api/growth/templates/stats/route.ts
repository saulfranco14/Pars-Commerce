import { NextResponse } from "next/server";

import { requireGrowthMember } from "@/app/api/growth/_lib";

import { variantStats } from "@/features/growth/services/templateService";
import { TEMPLATE_STEPS } from "@/features/growth/constants/templateVariables";

export async function GET(request: Request) {
  const gate = await requireGrowthMember({ manage: true });
  if ("error" in gate) return gate.error;
  const step = TEMPLATE_STEPS.whatsapp.find((item) => item.value === new URL(request.url).searchParams.get("step"))?.value;
  if (!step) return NextResponse.json({ error: "Paso inválido" }, { status: 400 });
  return NextResponse.json(Object.values(await variantStats(gate.db, gate.actor.workspaceId, step)));
}
