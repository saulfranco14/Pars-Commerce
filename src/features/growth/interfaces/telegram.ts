export interface TelegramChat {
  id: number;
}

export interface TelegramMessage {
  message_id: number;
  chat: TelegramChat;
  text?: string;
  location?: { latitude: number; longitude: number };
}

export interface TelegramUpdate {
  update_id: number;
  message?: TelegramMessage;
  callback_query?: {
    id: string;
    data?: string;
    message?: TelegramMessage;
  };
}

export type TelegramAction =
  | { kind: "command"; chatId: number; command: string; args: string }
  | { kind: "callback"; chatId: number; callbackId: string; data: string; messageId: number | null }
  | { kind: "location"; chatId: number; lat: number; lng: number }
  | { kind: "text"; chatId: number; text: string }
  | { kind: "ignored" };

export type InlineButton =
  | { text: string; callback_data: string }
  | { text: string; url: string }
  | { text: string; copy_text: { text: string } };

export interface OutgoingMessage {
  text: string;
  buttons?: InlineButton[][];
}
