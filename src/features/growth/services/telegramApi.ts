import type { InlineButton, OutgoingMessage } from "@/features/growth/interfaces/telegram";

type TelegramResponse<T> = { ok: boolean; result?: T; description?: string };

export function isTelegramConfigured(): boolean {
  return Boolean(process.env.TELEGRAM_BOT_TOKEN);
}

export function escapeHtml(value: string): string {
  return value.replace(/[&<>"]/g, (char) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" })[char] ?? char);
}

/** Never throws: Telegram being down must not break the engine or a registration. */
export async function telegramCall<T>(method: string, payload: Record<string, unknown>): Promise<TelegramResponse<T>> {
  const token = process.env.TELEGRAM_BOT_TOKEN;
  if (!token) return { ok: false, description: "TELEGRAM_BOT_TOKEN missing" };
  try {
    const response = await fetch(`https://api.telegram.org/bot${token}/${method}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
      signal: AbortSignal.timeout(8000),
    });
    const body = (await response.json()) as TelegramResponse<T>;
    if (!body.ok) console.error(`[growth] telegram ${method} failed:`, body.description);
    return body;
  } catch (error) {
    console.error(`[growth] telegram ${method} error:`, error);
    return { ok: false, description: error instanceof Error ? error.message : "network error" };
  }
}

function keyboard(buttons?: InlineButton[][]) {
  return buttons?.length ? { inline_keyboard: buttons } : undefined;
}

export function sendMessage(chatId: number, message: OutgoingMessage) {
  return telegramCall<{ message_id: number }>("sendMessage", {
    chat_id: chatId,
    text: message.text,
    parse_mode: "HTML",
    link_preview_options: { is_disabled: true },
    reply_markup: keyboard(message.buttons),
  });
}

export function answerCallback(callbackId: string, text?: string) {
  return telegramCall("answerCallbackQuery", { callback_query_id: callbackId, text });
}

export function replaceButtons(chatId: number, messageId: number, buttons: InlineButton[][]) {
  return telegramCall("editMessageReplyMarkup", { chat_id: chatId, message_id: messageId, reply_markup: { inline_keyboard: buttons } });
}

export function setWebhook(url: string, secret: string) {
  return telegramCall("setWebhook", {
    url,
    secret_token: secret,
    allowed_updates: ["message", "callback_query"],
    drop_pending_updates: true,
  });
}

export async function botUsername(): Promise<string | null> {
  const response = await telegramCall<{ username: string }>("getMe", {});
  return response.result?.username ?? null;
}
