import { NextResponse } from "next/server";

import { readJson } from "@/lib/readJson";
import { requireGrowthMember } from "@/app/api/growth/_lib";

import { serviceErrorToResponse } from "@/features/qr/services/serviceErrorToResponse";
import { importCsv } from "@/features/growth/services/importService";

import type { CsvImportInput } from "@/features/growth/interfaces/importJob";

export const maxDuration = 60;

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export async function POST(request: Request) {
  const gate = await requireGrowthMember({ manage: true });
  if ("error" in gate) return gate.error;
  const body = await readJson<Partial<CsvImportInput>>(request);
  if (typeof body?.csv !== "string") return NextResponse.json({ error: "Sube un archivo CSV." }, { status: 400 });
  const assignTo = typeof body.assignTo === "string" && UUID.test(body.assignTo) ? body.assignTo : null;
  const result = await importCsv(gate.db, gate.actor, { csv: body.csv, assignTo });
  if (!result.ok) return serviceErrorToResponse(result.error);
  return NextResponse.json(result.data);
}
