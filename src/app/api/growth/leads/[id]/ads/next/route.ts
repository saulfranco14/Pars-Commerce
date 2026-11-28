import { NextResponse } from "next/server";

import { requireGrowthMember } from "@/app/api/growth/_lib";
import { serviceErrorToResponse } from "@/features/qr/services/serviceErrorToResponse";
import { canActOn } from "@/features/growth/services/leadService";
import { nextLeadBackground } from "@/features/growth/services/prospectAdsService";

/** «Otro»: the next approved backgrounds for this prospect's ads. */
export async function POST(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const gate = await requireGrowthMember();
  if ("error" in gate) return gate.error;
  if (!(await canActOn(gate.db, gate.actor, id))) return NextResponse.json({ error: "Este prospecto lo trabaja otra persona del equipo." }, { status: 403 });
  const result = await nextLeadBackground(gate.db, id);
  if (!result.ok) return serviceErrorToResponse(result.error);
  return NextResponse.json(result.data);
}
