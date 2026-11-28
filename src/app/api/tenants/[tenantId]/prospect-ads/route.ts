import { NextResponse } from "next/server";

import { prospectWelcome } from "@/features/growth/services/prospectWelcomeService";
import { requireTenantProspect } from "@/features/growth/services/tenantProspectGate";

type Context = { params: Promise<{ tenantId: string }> };

/** The welcome card of a business that came from its gift ads. */
export async function GET(_request: Request, { params }: Context) {
  const gate = await requireTenantProspect((await params).tenantId);
  if ("error" in gate) return gate.error;
  return NextResponse.json(await prospectWelcome(gate.db, gate.lead));
}
