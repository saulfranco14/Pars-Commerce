import { NextResponse } from "next/server";

import { createAdminClient } from "@/lib/supabase/admin";

import { serviceErrorToResponse } from "@/features/qr/services/serviceErrorToResponse";
import { growthDb } from "@/features/growth/services/growthDb";
import { unsubscribe } from "@/features/growth/services/suppressionService";

/** Target of List-Unsubscribe-Post and of the /baja confirmation button; token in ?t=. */
export async function POST(request: Request) {
  const token = new URL(request.url).searchParams.get("t") ?? "";
  const result = await unsubscribe(growthDb(createAdminClient()), token);
  if (!result.ok) return serviceErrorToResponse(result.error);
  return NextResponse.json({ ok: true });
}
