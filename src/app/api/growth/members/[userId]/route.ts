import { NextResponse } from "next/server";

import { readJson } from "@/lib/readJson";
import { requireGrowthMember } from "@/app/api/growth/_lib";

import { serviceErrorToResponse } from "@/features/qr/services/serviceErrorToResponse";
import { updateMember } from "@/features/growth/services/memberService";

import type { MemberPatch } from "@/features/growth/interfaces/member";

export async function PATCH(request: Request, { params }: { params: Promise<{ userId: string }> }) {
  const gate = await requireGrowthMember({ manage: true });
  if ("error" in gate) return gate.error;
  const { userId } = await params;
  const body = await readJson<MemberPatch>(request);
  if (!body) return NextResponse.json({ error: "Cuerpo inválido" }, { status: 400 });
  const result = await updateMember(gate.db, gate.actor, userId, body);
  if (!result.ok) return serviceErrorToResponse(result.error);
  return NextResponse.json(result.data);
}
