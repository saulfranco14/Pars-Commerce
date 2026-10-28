import { NextResponse } from "next/server";

import { createAdminClient } from "@/lib/supabase/admin";
import { requirePlatformAdmin } from "@/app/api/platform/_lib";

import { serviceErrorToResponse } from "@/features/qr/services/serviceErrorToResponse";
import { growthDb } from "@/features/growth/services/growthDb";
import { loadBoard } from "@/features/growth/services/followUpService";

export async function GET(request: Request) {
  const gate = await requirePlatformAdmin();
  if ("error" in gate) return gate.error;
  const params = new URL(request.url).searchParams;
  const result = await loadBoard(growthDb(createAdminClient()), {
    municipio: params.get("municipio")?.slice(0, 80) || undefined,
    giro: params.get("giro")?.slice(0, 40) || undefined,
  });
  if (!result.ok) return serviceErrorToResponse(result.error);
  return NextResponse.json(result.data);
}
