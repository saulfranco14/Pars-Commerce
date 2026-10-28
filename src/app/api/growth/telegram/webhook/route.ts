import { NextResponse } from "next/server";

import { createAdminClient } from "@/lib/supabase/admin";
import { readJson } from "@/lib/readJson";

import { parseTelegramUpdate } from "@/features/growth/helpers/parseTelegramUpdate";
import { safeEqual } from "@/features/growth/helpers/safeEqual";
import { growthDb, isGrowthEnabled } from "@/features/growth/services/growthDb";
import { handleTelegramAction } from "@/features/growth/services/telegramBotService";

import type { TelegramUpdate } from "@/features/growth/interfaces/telegram";

export const maxDuration = 60;

export async function POST(request: Request) {
  if (!isGrowthEnabled()) return NextResponse.json({ error: "Growth engine disabled" }, { status: 503 });
  if (!safeEqual(request.headers.get("x-telegram-bot-api-secret-token"), process.env.TELEGRAM_WEBHOOK_SECRET)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }
  const update = await readJson<TelegramUpdate>(request);
  if (!update) return NextResponse.json({ error: "Invalid body" }, { status: 400 });

  try {
    await handleTelegramAction(growthDb(createAdminClient()), parseTelegramUpdate(update));
  } catch (error) {
    // Telegram retries non-2xx forever; log and acknowledge so one bad update can't jam the queue.
    console.error("[growth] telegram update failed:", error);
  }
  return NextResponse.json({ ok: true });
}
