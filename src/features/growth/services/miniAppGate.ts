import { NextResponse } from "next/server";

import { createAdminClient } from "@/lib/supabase/admin";

import { MINI_APP_INIT_HEADER } from "@/features/growth/constants/miniApp";
import { verifyInitData } from "@/features/growth/helpers/telegramInitData";
import { growthDb } from "@/features/growth/services/growthDb";
import { chatActor } from "@/features/growth/services/operatorService";

import type { GrowthDb } from "@/features/growth/services/growthDb";
import type { GrowthActor } from "@/features/growth/interfaces/member";

/**
 * Every mini app request carries Telegram's signed initData. A private chat's id is the user's id,
 * so the linked operator chat (the same /start code as the bot) says who is acting.
 */
export async function requireMiniAppActor(request: Request): Promise<{ db: GrowthDb; actor: GrowthActor } | { error: NextResponse }> {
  const user = verifyInitData(request.headers.get(MINI_APP_INIT_HEADER) ?? "", process.env.TELEGRAM_BOT_TOKEN ?? "");
  if (!user) return { error: NextResponse.json({ error: "Abre la app desde el bot de Telegram." }, { status: 401 }) };
  const db = growthDb(createAdminClient());
  const actor = await chatActor(db, user.id);
  if (!actor) return { error: NextResponse.json({ error: "Vincula tu Telegram desde Motor para usar la app." }, { status: 403 }) };
  return { db, actor };
}
