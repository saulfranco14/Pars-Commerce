import { NextResponse } from "next/server";

import { readJson } from "@/lib/readJson";
import { requireGrowthMember } from "@/app/api/growth/_lib";

import { serviceErrorToResponse } from "@/features/qr/services/serviceErrorToResponse";
import { buildWhatsappDraft } from "@/features/growth/services/whatsappDraftService";
import { WHATSAPP_STEP_ORDER } from "@/features/growth/helpers/suggestWhatsappStep";

import type { TemplateVariant } from "@/features/growth/interfaces/template";
import type { WhatsappStep } from "@/features/growth/interfaces/whatsapp";

const VARIANTS: TemplateVariant[] = ["A", "B", "C"];

/** POST because a draft may mint the lead's "Para ti" link. */
export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const gate = await requireGrowthMember();
  if ("error" in gate) return gate.error;
  const { id } = await params;
  const body = (await readJson<{ step?: WhatsappStep; variant?: TemplateVariant }>(request)) ?? {};
  if (body.step && !WHATSAPP_STEP_ORDER.includes(body.step)) return NextResponse.json({ error: "Paso no válido" }, { status: 400 });
  if (body.variant && !VARIANTS.includes(body.variant)) return NextResponse.json({ error: "Variante no válida" }, { status: 400 });

  const result = await buildWhatsappDraft(gate.db, gate.actor, id, { step: body.step, variant: body.variant });
  if (!result.ok) return serviceErrorToResponse(result.error);
  return NextResponse.json(result.data);
}
