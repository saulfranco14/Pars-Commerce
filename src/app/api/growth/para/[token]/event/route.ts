import { NextResponse } from "next/server";

import { createAdminClient } from "@/lib/supabase/admin";
import { readJson } from "@/lib/readJson";

import { serviceErrorToResponse } from "@/features/qr/services/serviceErrorToResponse";
import { growthDb } from "@/features/growth/services/growthDb";
import { trackParaEvent } from "@/features/growth/services/paraService";

import type { ParaLinkEvent } from "@/features/growth/interfaces/para";

const EVENTS: ParaLinkEvent[] = ["para_viewed", "para_seconds", "claim_clicked", "help_clicked"];

export async function POST(request: Request, { params }: { params: Promise<{ token: string }> }) {
  const { token } = await params;
  const body = await readJson<{ event?: string; seconds?: number }>(request);
  const event = body?.event as ParaLinkEvent | undefined;
  if (!event || !EVENTS.includes(event)) return NextResponse.json({ error: "Invalid event" }, { status: 400 });

  const result = await trackParaEvent(growthDb(createAdminClient()), token, event, body?.seconds);
  if (!result.ok) return serviceErrorToResponse(result.error);
  return NextResponse.json(result.data);
}
