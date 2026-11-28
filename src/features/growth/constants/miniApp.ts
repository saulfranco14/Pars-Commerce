export const MINI_APP_PATH = "/tg";
export const MINI_APP_INIT_HEADER = "x-telegram-init-data";
export const MINI_APP_API = "/api/growth/tg";
/** Telegram's Mini App script; loaded only on the mini app's pages. */
export const TELEGRAM_WEB_APP_SCRIPT = "https://telegram.org/js/telegram-web-app.js";

export const MINI_APP_TABS = [
  { key: "hoy", label: "Hoy" },
  { key: "respuestas", label: "Respuestas" },
  { key: "ruta", label: "Ruta" },
  { key: "numeros", label: "Números" },
] as const;
