import { NextResponse } from "next/server";

import { readJson } from "@/lib/readJson";
import { requireGrowthMember } from "@/app/api/growth/_lib";

import { serviceErrorToResponse } from "@/features/qr/services/serviceErrorToResponse";
import { addLead, listLeads } from "@/features/growth/services/leadService";
import { parseLeadFilters } from "@/features/growth/helpers/leadFiltersQuery";

import type { NewLeadInput } from "@/features/growth/interfaces/lead";

export async function GET(request: Request) {
  const gate = await requireGrowthMember();
  if ("error" in gate) return gate.error;
  const result = await listLeads(gate.db, gate.actor, parseLeadFilters(new URL(request.url).searchParams));
  if (!result.ok) return serviceErrorToResponse(result.error);
  return NextResponse.json(result.data);
}

/** «Nuevo prospecto»: answers 200 with the conflict when someone already works that phone or email. */
export async function POST(request: Request) {
  const gate = await requireGrowthMember();
  if ("error" in gate) return gate.error;
  const body = await readJson<NewLeadInput>(request);
  if (!body) return NextResponse.json({ error: "Cuerpo inválido" }, { status: 400 });
  const result = await addLead(gate.db, gate.actor, body);
  if (!result.ok) return serviceErrorToResponse(result.error);
  return NextResponse.json(result.data, { status: result.data.status === "created" ? 201 : 200 });
}
