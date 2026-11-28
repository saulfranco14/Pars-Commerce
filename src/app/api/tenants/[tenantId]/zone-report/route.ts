import { NextResponse } from "next/server";

import { zoneReport } from "@/features/growth/services/prospectWelcomeService";
import { requireTenantProspect } from "@/features/growth/services/tenantProspectGate";

type Context = { params: Promise<{ tenantId: string }> };

/** How many businesses of the same giro are around this one, and two ideas written as tests. */
export async function GET(_request: Request, { params }: Context) {
  const gate = await requireTenantProspect((await params).tenantId);
  if ("error" in gate) return gate.error;
  const report = await zoneReport(gate.db, gate.lead);
  if (!report) return NextResponse.json({ error: "Todavía no tenemos la ubicación de su negocio." }, { status: 404 });
  return NextResponse.json(report);
}
