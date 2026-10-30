import { NextResponse } from "next/server";

import { requireGrowthMember } from "@/app/api/growth/_lib";

import { serviceErrorToResponse } from "@/features/qr/services/serviceErrorToResponse";
import { testMailbox } from "@/features/growth/services/mailboxService";

export const maxDuration = 30;

export async function POST(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const gate = await requireGrowthMember({ manage: true });
  if ("error" in gate) return gate.error;
  const { id } = await params;
  const result = await testMailbox(gate.db, gate.actor.workspaceId, id);
  if (!result.ok) return serviceErrorToResponse(result.error);
  return NextResponse.json(result.data);
}
