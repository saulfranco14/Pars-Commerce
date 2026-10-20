import { randomInt } from "node:crypto";

// No 0/O, 1/l/I: the owner reads it out or types it into WhatsApp.
const ALPHABET = "ABCDEFGHJKMNPQRSTUVWXYZabcdefghijkmnpqrstuvwxyz23456789";

function pick(length: number): string {
  return Array.from({ length }, () => ALPHABET[randomInt(ALPHABET.length)]).join("");
}

/** One-time password for a staff account: ~69 bits, grouped to be easy to share. */
export function generateTempPassword(): string {
  return `${pick(4)}-${pick(4)}-${pick(4)}`;
}
