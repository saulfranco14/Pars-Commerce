import { randomBytes } from "crypto";

import { hashPreviewToken } from "@/features/preview/previewLinks";
import { botUsername, isTelegramConfigured, sendMessage } from "@/features/growth/services/telegramApi";
import { internalError } from "@/features/growth/services/growthDb";

import type { GrowthDb } from "@/features/growth/services/growthDb";
import type { OutgoingMessage } from "@/features/growth/interfaces/telegram";
import type { ServiceResult } from "@/features/qr/services/tablePaymentService";

const CODE_MINUTES = 15;

export async function createLinkCode(db: GrowthDb, userId: string): Promise<ServiceResult<{ code: string; deepLink: string | null; expiresAt: string }>> {
  if (!isTelegramConfigured()) {
    return { ok: false, error: { code: "validation", message: "Falta TELEGRAM_BOT_TOKEN en las variables de entorno." } };
  }
  const code = randomBytes(6).toString("hex").toUpperCase();
  const expiresAt = new Date(Date.now() + CODE_MINUTES * 60_000).toISOString();
  const { error } = await db.from("growth_operator_chats").insert({
    user_id: userId,
    link_code_hash: hashPreviewToken(code),
    link_expires_at: expiresAt,
  });
  if (error) return internalError(error.message);
  const username = await botUsername();
  return { ok: true, data: { code, deepLink: username ? `https://t.me/${username}?start=${code}` : null, expiresAt } };
}

export async function linkChat(db: GrowthDb, code: string, chatId: number): Promise<boolean> {
  const { data } = await db
    .from("growth_operator_chats")
    .select("id, link_expires_at")
    .eq("link_code_hash", hashPreviewToken(code.toUpperCase().replace(/[^0-9A-F]/g, "")))
    .is("linked_at", null)
    .maybeSingle();
  if (!data || new Date(data.link_expires_at).getTime() <= Date.now()) return false;

  await db.from("growth_operator_chats").update({ chat_id: null }).eq("chat_id", chatId);
  const { error } = await db
    .from("growth_operator_chats")
    .update({ chat_id: chatId, linked_at: new Date().toISOString(), link_code_hash: null, link_expires_at: null })
    .eq("id", data.id);
  return !error;
}

export async function isLinkedChat(db: GrowthDb, chatId: number): Promise<boolean> {
  const { data } = await db.from("growth_operator_chats").select("id").eq("chat_id", chatId).not("linked_at", "is", null).maybeSingle();
  return Boolean(data);
}

export async function countLinkedChats(db: GrowthDb): Promise<number> {
  const { count } = await db.from("growth_operator_chats").select("id", { count: "exact", head: true }).not("chat_id", "is", null);
  return count ?? 0;
}

/** Best effort: alerts never block the action that triggered them. */
export async function notifyOperators(db: GrowthDb, message: OutgoingMessage): Promise<void> {
  if (!isTelegramConfigured()) return;
  try {
    const { data } = await db.from("growth_operator_chats").select("chat_id").eq("notify", true).not("chat_id", "is", null);
    await Promise.all(((data ?? []) as Array<{ chat_id: number }>).map((row) => sendMessage(row.chat_id, message)));
  } catch (error) {
    console.error("[growth] notifyOperators failed:", error);
  }
}
