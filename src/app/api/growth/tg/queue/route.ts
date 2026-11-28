import { NextResponse } from "next/server";

import { readJson } from "@/lib/readJson";

import { serviceErrorToResponse } from "@/features/qr/services/serviceErrorToResponse";
import { requireMiniAppActor } from "@/features/growth/services/miniAppGate";
import { miniAppQueue, reserveMiniAppBatch } from "@/features/growth/services/miniAppService";

export const maxDuration = 60;

/** «Hoy»: the cards this operator already reserved. */
export async function GET(request: Request) {
  const gate = await requireMiniAppActor(request);
  if ("error" in gate) return gate.error;
  const result = await miniAppQueue(gate.db, gate.actor);
  if (!result.ok) return serviceErrorToResponse(result.error);
  return NextResponse.json(result.data);
}

/** Ten more, by zone and giro. */
export async function POST(request: Request) {
  const gate = await requireMiniAppActor(request);
  if ("error" in gate) return gate.error;
  const body = await readJson<{ zone?: string | null; giro?: string | null }>(request);
  const result = await reserveMiniAppBatch(gate.db, gate.actor, { zone: body?.zone ?? null, giro: body?.giro ?? null });
  if (!result.ok) return serviceErrorToResponse(result.error);
  return NextResponse.json(result.data);
}
