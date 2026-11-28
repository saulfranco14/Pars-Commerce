import { NextResponse } from "next/server";

import { readJson } from "@/lib/readJson";

import { serviceErrorToResponse } from "@/features/qr/services/serviceErrorToResponse";
import { requireMiniAppActor } from "@/features/growth/services/miniAppGate";
import { recentlyMessaged } from "@/features/growth/services/miniAppService";
import { assistReply } from "@/features/growth/services/replyAssistService";

export const maxDuration = 45;

/** The prospects written to lately, to say whose reply it is. */
export async function GET(request: Request) {
  const gate = await requireMiniAppActor(request);
  if ("error" in gate) return gate.error;
  return NextResponse.json(await recentlyMessaged(gate.db, gate.actor));
}

/** A pasted reply, read by the AI: the suggested answer and the ad redone with their price. Nothing is sent. */
export async function POST(request: Request) {
  const gate = await requireMiniAppActor(request);
  if ("error" in gate) return gate.error;
  const body = await readJson<{ leadId?: string; text?: string }>(request);
  if (!body?.leadId || typeof body.text !== "string") return NextResponse.json({ error: "Elige el negocio y pega lo que contestó." }, { status: 400 });
  const result = await assistReply(gate.db, gate.actor, body.leadId, body.text);
  if (!result.ok) return serviceErrorToResponse(result.error);
  return NextResponse.json(result.data);
}
