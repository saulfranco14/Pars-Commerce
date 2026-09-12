import { createHash, randomBytes, timingSafeEqual } from "node:crypto";

/** Cookie httpOnly: así un XSS en la pantalla no puede leer el token. */
export const DEVICE_COOKIE = "tlaco_device_token";

// Sin O/0/I/1: el dueño lee este código de la pantalla y lo compara.
const CODE_ALPHABET = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
const CODE_LENGTH = 6;

export function generateEnrollCode(): string {
  const bytes = randomBytes(CODE_LENGTH);
  let out = "";
  for (let i = 0; i < CODE_LENGTH; i++) {
    out += CODE_ALPHABET[bytes[i] % CODE_ALPHABET.length];
  }
  return out;
}

export function generateDeviceToken(): string {
  return randomBytes(32).toString("hex");
}

export function hashDeviceToken(token: string): string {
  return createHash("sha256").update(token).digest("hex");
}

/**
 * Compara hashes en tiempo constante. Un `===` filtra por cuánto tarda en
 * fallar, que es suficiente para adivinar un token byte a byte.
 */
export function deviceTokenMatches(token: string, storedHash: string): boolean {
  const a = Buffer.from(hashDeviceToken(token), "hex");
  const b = Buffer.from(storedHash, "hex");
  if (a.length !== b.length) return false;
  return timingSafeEqual(a, b);
}
