import { NextResponse } from "next/server";

import { createAdminClient } from "@/lib/supabase/admin";
import { readJson } from "@/lib/readJson";

import { serviceErrorToResponse } from "@/features/qr/services/serviceErrorToResponse";
import { PARA_LINK_EVENTS } from "@/features/growth/constants/para";
import { growthDb } from "@/features/growth/services/growthDb";
import { trackParaEvent } from "@/features/growth/services/paraService";

import type { ParaLinkEvent } from "@/features/growth/interfaces/para";

export async function POST(request: Request, { params }: { params: Promise<{ token: string }> }) {
  const { token } = await params;
  const body = await readJson<{ event?: string; seconds?: number; payload?: unknown }>(request);
  const event = body?.event as ParaLinkEvent | undefined;
  if (!event || !PARA_LINK_EVENTS.includes(event)) return NextResponse.json({ error: "Invalid event" }, { status: 400 });

  const result = await trackParaEvent(growthDb(createAdminClient()), token, event, { seconds: body?.seconds, payload: body?.payload });
  if (!result.ok) return serviceErrorToResponse(result.error);
  return NextResponse.json(result.data);
}
