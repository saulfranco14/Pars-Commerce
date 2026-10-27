import { NextResponse } from "next/server";

import { createAdminClient } from "@/lib/supabase/admin";
import { readJson } from "@/lib/readJson";
import { requirePlatformAdmin } from "@/app/api/platform/_lib";

import { serviceErrorToResponse } from "@/features/qr/services/serviceErrorToResponse";
import { growthDb } from "@/features/growth/services/growthDb";
import { buildWhatsappDraft } from "@/features/growth/services/whatsappDraftService";
import { WHATSAPP_STEP_ORDER } from "@/features/growth/helpers/suggestWhatsappStep";

import type { TemplateVariant } from "@/features/growth/interfaces/template";
import type { WhatsappStep } from "@/features/growth/interfaces/whatsapp";

const VARIANTS: TemplateVariant[] = ["A", "B", "C"];

/** POST because every draft mints a fresh "Para ti" link tied to the template shown. */
export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const gate = await requirePlatformAdmin();
  if ("error" in gate) return gate.error;
  const { id } = await params;
  const body = (await readJson<{ step?: WhatsappStep; variant?: TemplateVariant }>(request)) ?? {};
  if (body.step && !WHATSAPP_STEP_ORDER.includes(body.step)) return NextResponse.json({ error: "Paso no válido" }, { status: 400 });
  if (body.variant && !VARIANTS.includes(body.variant)) return NextResponse.json({ error: "Variante no válida" }, { status: 400 });

  const result = await buildWhatsappDraft(growthDb(createAdminClient()), id, { step: body.step, variant: body.variant });
  if (!result.ok) return serviceErrorToResponse(result.error);
  return NextResponse.json(result.data);
}
