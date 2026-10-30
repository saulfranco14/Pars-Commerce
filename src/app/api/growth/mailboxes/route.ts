import { NextResponse } from "next/server";

import { readJson } from "@/lib/readJson";
import { requireGrowthMember } from "@/app/api/growth/_lib";

import { serviceErrorToResponse } from "@/features/qr/services/serviceErrorToResponse";
import { createMailbox, listMailboxes } from "@/features/growth/services/mailboxService";

import type { MailboxInput } from "@/features/growth/interfaces/settings";

export async function GET() {
  const gate = await requireGrowthMember({ manage: true });
  if ("error" in gate) return gate.error;
  return NextResponse.json(await listMailboxes(gate.db, gate.actor.workspaceId));
}

export async function POST(request: Request) {
  const gate = await requireGrowthMember({ manage: true });
  if ("error" in gate) return gate.error;
  const body = await readJson<MailboxInput>(request);
  if (!body) return NextResponse.json({ error: "Cuerpo inválido" }, { status: 400 });
  const result = await createMailbox(gate.db, gate.actor.workspaceId, body);
  if (!result.ok) return serviceErrorToResponse(result.error);
  return NextResponse.json(result.data, { status: 201 });
}
