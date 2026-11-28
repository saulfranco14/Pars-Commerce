import { NextResponse } from "next/server";

import { createAdminClient } from "@/lib/supabase/admin";
import { readJson } from "@/lib/readJson";

import { requireGrowthMember } from "@/app/api/growth/_lib";
import { serviceErrorToResponse } from "@/features/qr/services/serviceErrorToResponse";
import { generateAdBackgrounds, isAdBackgroundKind, isAdGiro, listAdBackgrounds } from "@/features/growth/services/adBackgroundService";

export const maxDuration = 120;

const tlacoOnly = () => NextResponse.json({ error: "Los fondos de anuncios son de Tlaco." }, { status: 403 });

export async function GET(request: Request) {
  const gate = await requireGrowthMember({ manage: true });
  if ("error" in gate) return gate.error;
  if (gate.actor.tenantId) return tlacoOnly();
  const giro =new URL(request.url).searchParams.get("giro");
  if (!isAdGiro(giro)) return NextResponse.json({ error: "Elige un giro." }, { status: 400 });
  const result = await listAdBackgrounds(gate.db, giro);
  if (!result.ok) return serviceErrorToResponse(result.error);
  return NextResponse.json(result.data);
}

/** Generates a batch with the Studio image model; each one waits for review. */
export async function POST(request: Request) {
  const gate = await requireGrowthMember({ manage: true });
  if ("error" in gate) return gate.error;
  if (gate.actor.tenantId) return tlacoOnly();
  const body = await readJson<{ giro?: unknown; kind?: unknown }>(request);
  if (!isAdGiro(body?.giro) || !isAdBackgroundKind(body?.kind)) return NextResponse.json({ error: "Elige el giro y el tipo de imagen." }, { status: 400 });
  const result = await generateAdBackgrounds(createAdminClient(), gate.db, gate.actor, body.giro, body.kind);
  if (!result.ok) return serviceErrorToResponse(result.error);
  return NextResponse.json(result.data, { status: 201 });
}
