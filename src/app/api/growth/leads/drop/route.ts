import { NextResponse } from "next/server";

import { readJson } from "@/lib/readJson";
import { requireGrowthMember } from "@/app/api/growth/_lib";

import { serviceErrorToResponse } from "@/features/qr/services/serviceErrorToResponse";
import { dropLeads } from "@/features/growth/services/cleanupService";
import { DROP_REASONS } from "@/features/growth/constants/dropReasons";

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export async function POST(request: Request) {
  const gate = await requireGrowthMember();
  if ("error" in gate) return gate.error;
  const body = await readJson<{ leadIds?: unknown; reason?: unknown }>(request);
  const leadIds = Array.isArray(body?.leadIds) ? body.leadIds.filter((id): id is string => typeof id === "string" && UUID.test(id)).slice(0, 1000) : [];
  const reason = DROP_REASONS.find((item) => item.value === body?.reason)?.value;
  if (!leadIds.length) return NextResponse.json({ error: "Elige al menos un negocio." }, { status: 400 });
  if (!reason) return NextResponse.json({ error: "Elige el motivo de la baja." }, { status: 400 });
  const result = await dropLeads(gate.db, gate.actor, leadIds, reason);
  if (!result.ok) return serviceErrorToResponse(result.error);
  return NextResponse.json(result.data);
}
