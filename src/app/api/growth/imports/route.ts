import { after, NextResponse } from "next/server";

import { readJson } from "@/lib/readJson";
import { requireGrowthMember } from "@/app/api/growth/_lib";

import { serviceErrorToResponse } from "@/features/qr/services/serviceErrorToResponse";
import { createImport, listImports, runImportStep } from "@/features/growth/services/importService";

import type { ImportInput } from "@/features/growth/interfaces/importJob";

export const maxDuration = 60;

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

function importInput(body: Partial<ImportInput> | null): ImportInput {
  return {
    municipios: Array.isArray(body?.municipios) ? body.municipios.filter((value): value is string => typeof value === "string").slice(0, 20) : [],
    giros: Array.isArray(body?.giros) ? body.giros.filter((value): value is string => typeof value === "string").slice(0, 20) : [],
    onlyWithContact: body?.onlyWithContact !== false,
    assignTo: typeof body?.assignTo === "string" && UUID.test(body.assignTo) ? body.assignTo : null,
  };
}

export async function GET() {
  const gate = await requireGrowthMember({ manage: true });
  if ("error" in gate) return gate.error;
  const result = await listImports(gate.db, gate.actor);
  if (!result.ok) return serviceErrorToResponse(result.error);
  return NextResponse.json(result.data);
}

/** Creates the job and starts it right away; the cron tick finishes what does not fit in this request. */
export async function POST(request: Request) {
  const gate = await requireGrowthMember({ manage: true });
  if ("error" in gate) return gate.error;
  const result = await createImport(gate.db, gate.actor, importInput(await readJson<Partial<ImportInput>>(request)));
  if (!result.ok) return serviceErrorToResponse(result.error);
  after(() => runImportStep(gate.db, result.data.id, 45_000));
  return NextResponse.json(result.data, { status: 201 });
}
