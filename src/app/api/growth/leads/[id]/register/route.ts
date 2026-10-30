import { NextResponse } from "next/server";

import { createAdminClient } from "@/lib/supabase/admin";
import { readJson } from "@/lib/readJson";
import { requireGrowthMember } from "@/app/api/growth/_lib";

import { serviceErrorToResponse } from "@/features/qr/services/serviceErrorToResponse";
import { registerLeadBusiness } from "@/features/growth/services/registrationService";

import type { LeadRegistrationInput } from "@/features/growth/interfaces/lead";

export const maxDuration = 30;

export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const gate = await requireGrowthMember();
  if ("error" in gate) return gate.error;
  const { id } = await params;
  const body = await readJson<LeadRegistrationInput>(request);
  if (!body) return NextResponse.json({ error: "Cuerpo inválido" }, { status: 400 });
  const result = await registerLeadBusiness(createAdminClient(), gate.db, gate.actor, id, body);
  if (!result.ok) return serviceErrorToResponse(result.error);
  return NextResponse.json(result.data, { status: 201 });
}
