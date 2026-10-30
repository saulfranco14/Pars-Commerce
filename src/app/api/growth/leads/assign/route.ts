import { NextResponse } from "next/server";

import { readJson } from "@/lib/readJson";
import { requireGrowthMember } from "@/app/api/growth/_lib";

import { serviceErrorToResponse } from "@/features/qr/services/serviceErrorToResponse";
import { assignLeads } from "@/features/growth/services/memberService";

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export async function POST(request: Request) {
  const gate = await requireGrowthMember({ manage: true });
  if ("error" in gate) return gate.error;
  const body = await readJson<{ leadIds?: unknown; ownerId?: unknown }>(request);
  const leadIds = Array.isArray(body?.leadIds) ? body.leadIds.filter((id): id is string => typeof id === "string" && UUID.test(id)).slice(0, 500) : [];
  const ownerId = typeof body?.ownerId === "string" && UUID.test(body.ownerId) ? body.ownerId : null;
  if (!leadIds.length) return NextResponse.json({ error: "Elige al menos un prospecto." }, { status: 400 });
  const result = await assignLeads(gate.db, gate.actor, leadIds, ownerId);
  if (!result.ok) return serviceErrorToResponse(result.error);
  return NextResponse.json(result.data);
}
