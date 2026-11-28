import { NextResponse } from "next/server";

import { readJson } from "@/lib/readJson";

import { serviceErrorToResponse } from "@/features/qr/services/serviceErrorToResponse";
import { canActOn } from "@/features/growth/services/leadService";
import { requireMiniAppActor } from "@/features/growth/services/miniAppGate";
import { nextLeadBackground } from "@/features/growth/services/prospectAdsService";

/** «Otro»: the next approved backgrounds for this prospect's ads. */
export async function POST(request: Request) {
  const gate = await requireMiniAppActor(request);
  if ("error" in gate) return gate.error;
  const body = await readJson<{ leadId?: string }>(request);
  if (!body?.leadId) return NextResponse.json({ error: "Falta el prospecto." }, { status: 400 });
  if (!(await canActOn(gate.db, gate.actor, body.leadId))) return NextResponse.json({ error: "Este prospecto lo trabaja otra persona del equipo." }, { status: 403 });
  const result = await nextLeadBackground(gate.db, body.leadId);
  if (!result.ok) return serviceErrorToResponse(result.error);
  return NextResponse.json(result.data);
}
