import { randomBytes } from "crypto";

import { hashPreviewToken } from "@/features/preview/previewLinks";
import { TLACO_WORKSPACE_ID } from "@/features/growth/constants/workspace";
import { botUsername, isTelegramConfigured, sendMessage } from "@/features/growth/services/telegramApi";
import { internalError } from "@/features/growth/services/growthDb";
import { resolveActor } from "@/features/growth/services/memberService";

import type { GrowthDb } from "@/features/growth/services/growthDb";
import type { GrowthActor } from "@/features/growth/interfaces/member";
import type { OutgoingMessage } from "@/features/growth/interfaces/telegram";
import type { ServiceResult } from "@/features/qr/services/tablePaymentService";

const CODE_MINUTES = 15;

export async function createLinkCode(db: GrowthDb, actor: GrowthActor): Promise<ServiceResult<{ code: string; deepLink: string | null; expiresAt: string }>> {
  if (!isTelegramConfigured()) {
    return { ok: false, error: { code: "validation", message: "Falta TELEGRAM_BOT_TOKEN en las variables de entorno." } };
  }
  const code = randomBytes(6).toString("hex").toUpperCase();
  const expiresAt = new Date(Date.now() + CODE_MINUTES * 60_000).toISOString();
  const { error } = await db.from("growth_operator_chats").insert({
    user_id: actor.userId,
    workspace_id: actor.workspaceId,
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

/** The member behind a linked chat; null when the chat is not linked or the person left the team. */
export async function chatActor(db: GrowthDb, chatId: number): Promise<GrowthActor | null> {
  const { data } = await db.from("growth_operator_chats").select("user_id, workspace_id").eq("chat_id", chatId).not("linked_at", "is", null).maybeSingle();
  if (!data) return null;
  return resolveActor(db, data.user_id as string, data.workspace_id as string);
}

export async function countLinkedChats(db: GrowthDb, workspaceId: string): Promise<number> {
  const { count } = await db.from("growth_operator_chats").select("id", { count: "exact", head: true }).eq("workspace_id", workspaceId).not("chat_id", "is", null);
  return count ?? 0;
}

/** Where an alert about one prospect goes: its workspace and its owner. */
export async function leadAlertTarget(db: GrowthDb, leadId: string | null | undefined): Promise<{ workspaceId: string; ownerId: string | null }> {
  if (!leadId) return { workspaceId: TLACO_WORKSPACE_ID, ownerId: null };
  const { data } = await db.from("growth_leads").select("workspace_id, owner_user_id").eq("id", leadId).maybeSingle();
  return { workspaceId: (data?.workspace_id as string | undefined) ?? TLACO_WORKSPACE_ID, ownerId: (data?.owner_user_id as string | null) ?? null };
}

async function coordinatorIds(db: GrowthDb, workspaceId: string): Promise<string[]> {
  const [{ data: members }, { data: admins }] = await Promise.all([
    db.from("growth_members").select("user_id").eq("workspace_id", workspaceId).eq("role", "coordinador").neq("status", "suspended"),
    workspaceId === TLACO_WORKSPACE_ID ? db.from("platform_admins").select("user_id") : Promise.resolve({ data: [] }),
  ]);
  return [...((members ?? []) as Array<{ user_id: string }>), ...((admins ?? []) as Array<{ user_id: string }>)].map((row) => row.user_id);
}

/**
 * Best effort: alerts never block the action that triggered them. About one prospect they go to its owner and
 * the coordinators; about the engine (digest, a paused mailbox) only to the coordinators.
 */
export async function notifyOperators(
  db: GrowthDb,
  message: OutgoingMessage,
  target: { workspaceId?: string; ownerId?: string | null } = {},
): Promise<void> {
  if (!isTelegramConfigured()) return;
  try {
    const workspaceId = target.workspaceId ?? TLACO_WORKSPACE_ID;
    const recipients = new Set(await coordinatorIds(db, workspaceId));
    if (target.ownerId) recipients.add(target.ownerId);
    if (!recipients.size) return;
    const { data } = await db
      .from("growth_operator_chats")
      .select("chat_id")
      .eq("workspace_id", workspaceId)
      .eq("notify", true)
      .not("chat_id", "is", null)
      .in("user_id", [...recipients]);
    await Promise.all(((data ?? []) as Array<{ chat_id: number }>).map((row) => sendMessage(row.chat_id, message)));
  } catch (error) {
    console.error("[growth] notifyOperators failed:", error);
  }
}
