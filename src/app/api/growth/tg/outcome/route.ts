import { NextResponse } from "next/server";

import { readJson } from "@/lib/readJson";

import { serviceErrorToResponse } from "@/features/qr/services/serviceErrorToResponse";
import { requireMiniAppActor } from "@/features/growth/services/miniAppGate";
import { markMiniAppOutcome } from "@/features/growth/services/miniAppService";

import type { MiniAppOutcome } from "@/features/growth/interfaces/miniApp";

const OUTCOMES: MiniAppOutcome[] = ["whatsapp_sent", "no_whatsapp", "wrong_number", "not_interested"];

export async function POST(request: Request) {
  const gate = await requireMiniAppActor(request);
  if ("error" in gate) return gate.error;
  const body = await readJson<{ leadId?: string; outcome?: string }>(request);
  if (!body?.leadId || !OUTCOMES.includes(body.outcome as MiniAppOutcome)) return NextResponse.json({ error: "Acción no válida." }, { status: 400 });
  const result = await markMiniAppOutcome(gate.db, gate.actor, body.leadId, body.outcome as MiniAppOutcome);
  if (!result.ok) return serviceErrorToResponse(result.error);
  return NextResponse.json(result.data);
}
