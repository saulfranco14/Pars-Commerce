export const STAFF_PASSWORD_MIN_LENGTH = 8;

// No 0/O, 1/l/I: the owner reads it out or types it into WhatsApp.
const ALPHABET = "ABCDEFGHJKMNPQRSTUVWXYZabcdefghijkmnpqrstuvwxyz23456789";

function randomIndex(max: number): number {
  // Rejection sampling keeps every character equally likely.
  const limit = Math.floor(0x100000000 / max) * max;
  const buffer = new Uint32Array(1);
  do {
    globalThis.crypto.getRandomValues(buffer);
  } while (buffer[0] >= limit);
  return buffer[0] % max;
}

function pick(length: number): string {
  return Array.from({ length }, () => ALPHABET[randomIndex(ALPHABET.length)]).join("");
}

/** Suggested password for a staff account: ~69 bits, grouped to be easy to share. */
export function generateStaffPassword(): string {
  return `${pick(4)}-${pick(4)}-${pick(4)}`;
}

export function staffPasswordError(password: string | undefined): string | null {
  if (!password?.trim()) return "Escribe una contraseña o genera una.";
  if (password.length < STAFF_PASSWORD_MIN_LENGTH) {
    return `Usa al menos ${STAFF_PASSWORD_MIN_LENGTH} caracteres.`;
  }
  return null;
}
