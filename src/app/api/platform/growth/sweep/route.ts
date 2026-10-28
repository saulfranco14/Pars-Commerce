import { NextResponse } from "next/server";

import { createAdminClient } from "@/lib/supabase/admin";
import { readJson } from "@/lib/readJson";
import { requirePlatformAdmin } from "@/app/api/platform/_lib";

import { serviceErrorToResponse } from "@/features/qr/services/serviceErrorToResponse";
import { growthDb } from "@/features/growth/services/growthDb";
import { loadSweep } from "@/features/growth/services/sweepService";

import type { SweepKind } from "@/features/growth/interfaces/sweep";

const KINDS: SweepKind[] = ["whatsapp", "seguimiento"];
const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

/** POST because it sets the next cards aside (growth_reserve_batch). */
export async function POST(request: Request) {
  const gate = await requirePlatformAdmin();
  if ("error" in gate) return gate.error;
  const body = await readJson<{ kind?: string; municipio?: string; giro?: string; exclude?: unknown }>(request);
  const kind = KINDS.find((value) => value === body?.kind);
  if (!body || !kind) return NextResponse.json({ error: "Elige primer mensaje o seguimientos" }, { status: 400 });
  const exclude = Array.isArray(body.exclude) ? body.exclude.filter((id): id is string => typeof id === "string" && UUID.test(id)).slice(0, 20) : [];

  const result = await loadSweep(
    growthDb(createAdminClient()),
    { kind, municipio: body.municipio?.slice(0, 80) || undefined, giro: body.giro?.slice(0, 40) || undefined },
    exclude,
  );
  if (!result.ok) return serviceErrorToResponse(result.error);
  return NextResponse.json(result.data);
}
