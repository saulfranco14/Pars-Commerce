import { NextResponse } from "next/server";

import { readJson } from "@/lib/readJson";
import { requireGrowthMember } from "@/app/api/growth/_lib";

import { serviceErrorToResponse } from "@/features/qr/services/serviceErrorToResponse";
import { loadSweep } from "@/features/growth/services/sweepService";

import type { SweepKind } from "@/features/growth/interfaces/sweep";

const KINDS: SweepKind[] = ["whatsapp", "seguimiento"];
const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

/** POST because it sets the next cards aside (growth_reserve_batch) for this person. */
export async function POST(request: Request) {
  const gate = await requireGrowthMember();
  if ("error" in gate) return gate.error;
  const body = await readJson<{ kind?: string; municipio?: string; giro?: string; exclude?: unknown }>(request);
  const kind = KINDS.find((value) => value === body?.kind);
  if (!body || !kind) return NextResponse.json({ error: "Elige primer mensaje o seguimientos" }, { status: 400 });
  const exclude = Array.isArray(body.exclude) ? body.exclude.filter((id): id is string => typeof id === "string" && UUID.test(id)).slice(0, 20) : [];

  const result = await loadSweep(
    gate.db,
    gate.actor,
    { kind, municipio: body.municipio?.slice(0, 80) || undefined, giro: body.giro?.slice(0, 40) || undefined },
    exclude,
  );
  if (!result.ok) return serviceErrorToResponse(result.error);
  return NextResponse.json(result.data);
}
