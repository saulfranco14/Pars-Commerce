import { createHmac, timingSafeEqual } from "node:crypto";

/** A day: the mini app re-opens with fresh data every time Telegram launches it. */
export const INIT_DATA_MAX_AGE_SECONDS = 86_400;

export interface MiniAppUser {
  id: number;
  firstName: string;
  /** `start_param` of a deep link (t.me/bot/app?startapp=…), e.g. a lead id. */
  startParam: string | null;
}

/**
 * The `initData` Telegram signs for a Mini App, checked as Telegram documents it:
 * secret = HMAC_SHA256(key "WebAppData", botToken); hash = HMAC_SHA256(secret, data_check_string).
 * Null when it is missing, forged or older than a day.
 */
export function verifyInitData(initData: string, botToken: string, now = new Date()): MiniAppUser | null {
  if (!initData || !botToken) return null;
  const params = new URLSearchParams(initData);
  const hash = params.get("hash");
  if (!hash || !/^[0-9a-f]{64}$/i.test(hash)) return null;
  params.delete("hash");
  const dataCheckString = [...params.entries()].map(([key, value]) => `${key}=${value}`).sort().join("\n");
  const secret = createHmac("sha256", "WebAppData").update(botToken).digest();
  const expected = createHmac("sha256", secret).update(dataCheckString).digest();
  const received = Buffer.from(hash, "hex");
  if (received.length !== expected.length || !timingSafeEqual(received, expected)) return null;

  const authDate = Number(params.get("auth_date"));
  if (!Number.isFinite(authDate) || now.getTime() / 1000 - authDate > INIT_DATA_MAX_AGE_SECONDS) return null;
  try {
    const user = JSON.parse(params.get("user") ?? "") as { id?: unknown; first_name?: unknown };
    if (typeof user.id !== "number") return null;
    return { id: user.id, firstName: typeof user.first_name === "string" ? user.first_name : "", startParam: params.get("start_param") };
  } catch {
    return null;
  }
}
