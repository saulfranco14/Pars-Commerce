import { NextResponse } from "next/server";

import { readJson } from "@/lib/readJson";
import { requireGrowthMember } from "@/app/api/growth/_lib";

import { serviceErrorToResponse } from "@/features/qr/services/serviceErrorToResponse";
import { setTemplateStatus } from "@/features/growth/services/templateService";

export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const gate = await requireGrowthMember({ manage: true });
  if ("error" in gate) return gate.error;
  const { id } = await params;
  const body = await readJson<{ status?: string }>(request);
  if (body?.status !== "active" && body?.status !== "paused") return NextResponse.json({ error: "Estado inválido" }, { status: 400 });
  const result = await setTemplateStatus(gate.db, gate.actor.workspaceId, id, body.status);
  if (!result.ok) return serviceErrorToResponse(result.error);
  return NextResponse.json(result.data);
}
