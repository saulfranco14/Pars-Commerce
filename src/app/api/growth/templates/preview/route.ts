import { NextResponse } from "next/server";

import { readJson } from "@/lib/readJson";
import { requireGrowthMember } from "@/app/api/growth/_lib";

import { serviceErrorToResponse } from "@/features/qr/services/serviceErrorToResponse";
import { normalizeTemplateDraft } from "@/features/growth/validations/templateDraft";
import { getSettings } from "@/features/growth/services/settingsService";
import { previewTemplate } from "@/features/growth/services/templateService";

export async function POST(request: Request) {
  const gate = await requireGrowthMember({ manage: true });
  if ("error" in gate) return gate.error;
  const draft = normalizeTemplateDraft(await readJson<unknown>(request));
  if (!draft) return NextResponse.json({ error: "Mensaje inválido" }, { status: 400 });
  const { db, actor } = gate;
  const firma = actor.signature ?? (await getSettings(db, actor.workspaceId)).signature;
  const result = await previewTemplate(db, actor.workspaceId, draft, firma);
  if (!result.ok) return serviceErrorToResponse(result.error);
  return NextResponse.json(result.data);
}
