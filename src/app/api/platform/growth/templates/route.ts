import { NextResponse } from "next/server";

import { createAdminClient } from "@/lib/supabase/admin";
import { readJson } from "@/lib/readJson";
import { requirePlatformAdmin } from "@/app/api/platform/_lib";

import { serviceErrorToResponse } from "@/features/qr/services/serviceErrorToResponse";
import { normalizeTemplateDraft } from "@/features/growth/validations/templateDraft";
import { growthDb } from "@/features/growth/services/growthDb";
import { listTemplates, saveTemplateVersion } from "@/features/growth/services/templateService";

export async function GET() {
  const gate = await requirePlatformAdmin();
  if ("error" in gate) return gate.error;
  const result = await listTemplates(growthDb(createAdminClient()));
  if (!result.ok) return serviceErrorToResponse(result.error);
  return NextResponse.json(result.data);
}

export async function POST(request: Request) {
  const gate = await requirePlatformAdmin();
  if ("error" in gate) return gate.error;
  const draft = normalizeTemplateDraft(await readJson<unknown>(request));
  if (!draft) return NextResponse.json({ error: "Mensaje inválido" }, { status: 400 });
  const result = await saveTemplateVersion(growthDb(createAdminClient()), draft, gate.user.id);
  if (!result.ok) return serviceErrorToResponse(result.error);
  return NextResponse.json(result.data, { status: 201 });
}
