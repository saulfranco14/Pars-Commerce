import { NextResponse } from "next/server";

import { createAdminClient } from "@/lib/supabase/admin";
import { readJson } from "@/lib/readJson";
import { requirePlatformAdmin } from "@/app/api/platform/_lib";

import { serviceErrorToResponse } from "@/features/qr/services/serviceErrorToResponse";
import { growthDb, isGrowthEnabled } from "@/features/growth/services/growthDb";
import { listMailboxes } from "@/features/growth/services/mailboxService";
import { countLinkedChats } from "@/features/growth/services/operatorService";
import { getSettings, updateSettings } from "@/features/growth/services/settingsService";
import { isTelegramConfigured } from "@/features/growth/services/telegramApi";

import type { EngineOverview, GrowthSettingsPatch } from "@/features/growth/interfaces/settings";

export async function GET() {
  const gate = await requirePlatformAdmin();
  if ("error" in gate) return gate.error;
  const db = growthDb(createAdminClient());
  try {
    const [settings, mailboxes, linkedChats] = await Promise.all([getSettings(db), listMailboxes(db), countLinkedChats(db)]);
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
  const gate = await requirePlatformAdmin();
  if ("error" in gate) return gate.error;
  const body = await readJson<GrowthSettingsPatch>(request);
  if (!body) return NextResponse.json({ error: "Cuerpo inválido" }, { status: 400 });
  const result = await updateSettings(growthDb(createAdminClient()), body);
  if (!result.ok) return serviceErrorToResponse(result.error);
  return NextResponse.json(result.data);
}
