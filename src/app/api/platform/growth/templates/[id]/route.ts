import { NextResponse } from "next/server";

import { createAdminClient } from "@/lib/supabase/admin";
import { readJson } from "@/lib/readJson";
import { requirePlatformAdmin } from "@/app/api/platform/_lib";

import { serviceErrorToResponse } from "@/features/qr/services/serviceErrorToResponse";
import { growthDb } from "@/features/growth/services/growthDb";
import { setTemplateStatus } from "@/features/growth/services/templateService";

export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const gate = await requirePlatformAdmin();
  if ("error" in gate) return gate.error;
  const { id } = await params;
  const body = await readJson<{ status?: string }>(request);
  if (body?.status !== "active" && body?.status !== "paused") return NextResponse.json({ error: "Estado inválido" }, { status: 400 });
  const result = await setTemplateStatus(growthDb(createAdminClient()), id, body.status);
  if (!result.ok) return serviceErrorToResponse(result.error);
  return NextResponse.json(result.data);
}
