import { NextResponse } from "next/server";

import { requireMiniAppActor } from "@/features/growth/services/miniAppGate";
import { dayStats, startOfMexicoDay } from "@/features/growth/services/statsService";

/** «Números»: how today is going. */
export async function GET(request: Request) {
  const gate = await requireMiniAppActor(request);
  if ("error" in gate) return gate.error;
  return NextResponse.json(await dayStats(gate.db, startOfMexicoDay(new Date())));
}
