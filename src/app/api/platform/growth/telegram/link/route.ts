import { NextResponse } from "next/server";

import { createAdminClient } from "@/lib/supabase/admin";
import { requirePlatformAdmin } from "@/app/api/platform/_lib";

import { serviceErrorToResponse } from "@/features/qr/services/serviceErrorToResponse";
import { growthDb } from "@/features/growth/services/growthDb";
import { createLinkCode } from "@/features/growth/services/operatorService";

export async function POST() {
  const gate = await requirePlatformAdmin();
  if ("error" in gate) return gate.error;
  const result = await createLinkCode(growthDb(createAdminClient()), gate.user.id);
  if (!result.ok) return serviceErrorToResponse(result.error);
  return NextResponse.json(result.data);
}
