import { NextResponse } from "next/server";
import { ValidationError } from "yup";

import { readJson } from "@/lib/readJson";
import { requireGrowthMember } from "@/app/api/growth/_lib";

import { serviceErrorToResponse } from "@/features/qr/services/serviceErrorToResponse";
import { followUp } from "@/features/growth/services/followUpService";
import { followUpBodySchema } from "@/features/growth/validations/followUpSchemas";

export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const gate = await requireGrowthMember();
  if ("error" in gate) return gate.error;
  const { id } = await params;
  let body;
  try {
    body = await followUpBodySchema.validate(await readJson(request), { stripUnknown: true });
  } catch (err) {
    return NextResponse.json({ error: err instanceof ValidationError ? err.message : "Cuerpo inválido" }, { status: 400 });
  }

  const result = await followUp(gate.db, gate.actor, id, { action: body.action, at: body.at ?? null, note: body.note || null });
  if (!result.ok) return serviceErrorToResponse(result.error);
  return NextResponse.json(result.data);
}
