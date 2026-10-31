import { NextResponse } from "next/server";

import { requireGrowthMember } from "@/app/api/growth/_lib";
import { getPublicAppUrl } from "@/lib/env/appUrl";

import { setWebhook } from "@/features/growth/services/telegramApi";

/** Points the bot at this deployment; Telegram then sends the secret header on every update. */
export async function POST() {
  const gate = await requireGrowthMember({ manage: true });
  if ("error" in gate) return gate.error;
  const secret = process.env.TELEGRAM_WEBHOOK_SECRET;
  if (!process.env.TELEGRAM_BOT_TOKEN || !secret) {
    return NextResponse.json({ error: "Faltan TELEGRAM_BOT_TOKEN o TELEGRAM_WEBHOOK_SECRET en las variables de entorno." }, { status: 400 });
  }
  const url = `${getPublicAppUrl()}/api/growth/telegram/webhook`;
  if (!url.startsWith("https://")) {
    return NextResponse.json({ error: "Telegram solo acepta webhooks con https. Conéctalo desde producción." }, { status: 400 });
  }
  const response = await setWebhook(url, secret);
  if (!response.ok) return NextResponse.json({ error: `Telegram rechazó el webhook: ${response.description ?? "sin detalle"}` }, { status: 502 });
  return NextResponse.json({ url });
}
