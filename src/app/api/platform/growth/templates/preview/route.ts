import { NextResponse } from "next/server";

import { createAdminClient } from "@/lib/supabase/admin";
import { readJson } from "@/lib/readJson";
import { requirePlatformAdmin } from "@/app/api/platform/_lib";

import { serviceErrorToResponse } from "@/features/qr/services/serviceErrorToResponse";
import { normalizeTemplateDraft } from "@/features/growth/validations/templateDraft";
import { growthDb } from "@/features/growth/services/growthDb";
import { getSettings } from "@/features/growth/services/settingsService";
import { previewTemplate } from "@/features/growth/services/templateService";

export async function POST(request: Request) {
  const gate = await requirePlatformAdmin();
  if ("error" in gate) return gate.error;
  const draft = normalizeTemplateDraft(await readJson<unknown>(request));
  if (!draft) return NextResponse.json({ error: "Mensaje inválido" }, { status: 400 });
  const db = growthDb(createAdminClient());
  const settings = await getSettings(db);
  const result = await previewTemplate(db, draft, settings.signature);
  if (!result.ok) return serviceErrorToResponse(result.error);
  return NextResponse.json(result.data);
}
