import { createCipheriv, createDecipheriv, createHash, randomBytes } from "node:crypto";

const ALGORITHM = "aes-256-gcm";
const IV_BYTES = 12;
const AUTH_TAG_BYTES = 16;
/** Any sealed value is longer than this many bytes. */
export const SEAL_OVERHEAD_BYTES = IV_BYTES + AUTH_TAG_BYTES;

/** 32-byte key from any secret of at least 32 characters; `purpose` keeps two uses of one secret apart. */
export function deriveKey(secret: string, purpose = ""): Buffer {
  return createHash("sha256").update(purpose ? `${purpose}:${secret}` : secret).digest();
}

/** AES-256-GCM envelope (iv + tag + ciphertext, base64url). Server-only. */
export function seal(value: string, key: Buffer): string {
  const iv = randomBytes(IV_BYTES);
  const cipher = createCipheriv(ALGORITHM, key, iv);
  const ciphertext = Buffer.concat([cipher.update(value, "utf8"), cipher.final()]);
  return Buffer.concat([iv, cipher.getAuthTag(), ciphertext]).toString("base64url");
}

/** Throws when the envelope is malformed or was sealed with another key. */
export function open(envelope: string, key: Buffer): string {
  const raw = Buffer.from(envelope, "base64url");
  if (raw.length <= IV_BYTES + AUTH_TAG_BYTES) throw new Error("Invalid sealed value");
  const decipher = createDecipheriv(ALGORITHM, key, raw.subarray(0, IV_BYTES));
  decipher.setAuthTag(raw.subarray(IV_BYTES, IV_BYTES + AUTH_TAG_BYTES));
  return Buffer.concat([decipher.update(raw.subarray(IV_BYTES + AUTH_TAG_BYTES)), decipher.final()]).toString("utf8");
}
