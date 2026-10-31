import { NextResponse } from "next/server";

import { readJson } from "@/lib/readJson";
import { requireGrowthMember } from "@/app/api/growth/_lib";

import { serviceErrorToResponse } from "@/features/qr/services/serviceErrorToResponse";
import { isGrowthEnabled } from "@/features/growth/services/growthDb";
import { listMailboxes } from "@/features/growth/services/mailboxService";
import { countLinkedChats } from "@/features/growth/services/operatorService";
import { getSettings, updateSettings } from "@/features/growth/services/settingsService";
import { isTelegramConfigured } from "@/features/growth/services/telegramApi";

import type { EngineOverview, GrowthSettingsPatch } from "@/features/growth/interfaces/settings";

export async function GET() {
  const gate = await requireGrowthMember({ manage: true });
  if ("error" in gate) return gate.error;
  const { db, actor } = gate;
  try {
    const [settings, mailboxes, linkedChats] = await Promise.all([
      getSettings(db, actor.workspaceId),
      listMailboxes(db, actor.workspaceId),
      countLinkedChats(db, actor.workspaceId),
    ]);
    const overview: EngineOverview = {
      settings,
      mailboxes,
      telegram: { configured: isTelegramConfigured() && Boolean(process.env.TELEGRAM_WEBHOOK_SECRET), linkedChats },
      enabled: isGrowthEnabled(),
      postalAddressSet: Boolean(process.env.GROWTH_POSTAL_ADDRESS?.trim()),
    };
    return NextResponse.json(overview);
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : "No pudimos leer el motor" }, { status: 500 });
  }
}

export async function PATCH(request: Request) {
  const gate = await requireGrowthMember({ manage: true });
  if ("error" in gate) return gate.error;
  const body = await readJson<GrowthSettingsPatch>(request);
  if (!body) return NextResponse.json({ error: "Cuerpo inválido" }, { status: 400 });
  const result = await updateSettings(gate.db, gate.actor.workspaceId, body);
  if (!result.ok) return serviceErrorToResponse(result.error);
  return NextResponse.json(result.data);
}
