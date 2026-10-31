import { NextResponse } from "next/server";

import { createAdminClient } from "@/lib/supabase/admin";
import { readJson } from "@/lib/readJson";
import { requireGrowthMember } from "@/app/api/growth/_lib";

import { serviceErrorToResponse } from "@/features/qr/services/serviceErrorToResponse";
import { inviteMember, listTeam } from "@/features/growth/services/memberService";

import type { MemberInviteInput } from "@/features/growth/interfaces/member";

export async function GET() {
  const gate = await requireGrowthMember({ manage: true });
  if ("error" in gate) return gate.error;
  const result = await listTeam(gate.db, gate.actor);
  if (!result.ok) return serviceErrorToResponse(result.error);
  return NextResponse.json(result.data);
}

export async function POST(request: Request) {
  const gate = await requireGrowthMember({ manage: true });
  if ("error" in gate) return gate.error;
  const body = await readJson<MemberInviteInput>(request);
  if (!body) return NextResponse.json({ error: "Cuerpo inválido" }, { status: 400 });
  const result = await inviteMember(createAdminClient(), gate.db, gate.actor, body);
  if (!result.ok) return serviceErrorToResponse(result.error);
  return NextResponse.json(result.data, { status: 201 });
}
