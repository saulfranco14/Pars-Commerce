import { NextResponse } from "next/server";

import { readJson } from "@/lib/readJson";

import { requireGrowthMember } from "@/app/api/growth/_lib";
import { serviceErrorToResponse } from "@/features/qr/services/serviceErrorToResponse";
import { reviewAdBackground } from "@/features/growth/services/adBackgroundService";

export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const gate = await requireGrowthMember({ manage: true });
  if ("error" in gate) return gate.error;
  if (gate.actor.tenantId) return NextResponse.json({ error: "Los fondos de anuncios son de Tlaco." }, { status: 403 });
  const body = await readJson<{ status?: unknown }>(request);
  if (body?.status !== "approved" && body?.status !== "rejected") return NextResponse.json({ error: "Aprueba o descarta la imagen." }, { status: 400 });
  const result = await reviewAdBackground(gate.db, gate.actor, (await params).id, body.status);
  if (!result.ok) return serviceErrorToResponse(result.error);
  return NextResponse.json(result.data);
}
