import type { TelegramAction, TelegramUpdate } from "@/features/growth/interfaces/telegram";

/** Turns a raw Bot API update into the few shapes the bot reacts to. */
export function parseTelegramUpdate(update: TelegramUpdate): TelegramAction {
  if (update.callback_query) {
    const query = update.callback_query;
    const chatId = query.message?.chat.id;
    if (!chatId || !query.data) return { kind: "ignored" };
    return { kind: "callback", chatId, callbackId: query.id, data: query.data, messageId: query.message?.message_id ?? null };
  }

  const message = update.message;
  if (!message) return { kind: "ignored" };
  const chatId = message.chat.id;

  if (message.location) {
    return { kind: "location", chatId, lat: message.location.latitude, lng: message.location.longitude };
  }

  const text = message.text?.trim();
  if (!text) return { kind: "ignored" };
  const command = /^\/([a-z_]+)(?:@\w+)?(?:\s+([\s\S]*))?$/i.exec(text);
  if (command) {
    return { kind: "command", chatId, command: command[1].toLowerCase(), args: command[2]?.trim() ?? "" };
  }
  return { kind: "text", chatId, text };
}

/** callback_data is "<action>:<arg>[:<arg>]" and must fit Telegram's 64-byte limit. */
export function encodeCallback(...parts: string[]): string {
  const data = parts.join(":");
  if (Buffer.byteLength(data, "utf8") > 64) throw new Error("callback_data too long");
  return data;
}

export function decodeCallback(data: string): { action: string; args: string[] } {
  const [action, ...args] = data.split(":");
  return { action, args };
}
