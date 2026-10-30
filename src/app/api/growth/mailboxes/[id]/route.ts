import { NextResponse } from "next/server";

import { readJson } from "@/lib/readJson";
import { requireGrowthMember } from "@/app/api/growth/_lib";

import { serviceErrorToResponse } from "@/features/qr/services/serviceErrorToResponse";
import { updateMailbox } from "@/features/growth/services/mailboxService";

export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const gate = await requireGrowthMember({ manage: true });
  if ("error" in gate) return gate.error;
  const { id } = await params;
  const body = await readJson<{ is_active?: boolean; daily_cap?: number }>(request);
  if (!body) return NextResponse.json({ error: "Cuerpo inválido" }, { status: 400 });
  const result = await updateMailbox(gate.db, gate.actor.workspaceId, id, body);
  if (!result.ok) return serviceErrorToResponse(result.error);
  return NextResponse.json(result.data);
}
