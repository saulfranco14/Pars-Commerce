import { createHash, timingSafeEqual } from "crypto";

/** Constant-time comparison for webhook and cron secrets. */
export function safeEqual(received: string | null | undefined, expected: string | undefined): boolean {
  if (!received || !expected) return false;
  const a = createHash("sha256").update(received).digest();
  const b = createHash("sha256").update(expected).digest();
  return timingSafeEqual(a, b);
}
