import { createCipheriv, createDecipheriv, createHash, randomBytes } from "node:crypto";

const ALGORITHM = "aes-256-gcm";
const IV_BYTES = 12;
const AUTH_TAG_BYTES = 16;

function key(): Buffer {
  const secret = process.env.MERCHANT_TOKEN_ENCRYPTION_KEY;
  if (!secret || secret.length < 32) {
    throw new Error(
      "MERCHANT_TOKEN_ENCRYPTION_KEY debe tener al menos 32 caracteres para conectar cobros",
    );
  }
  return createHash("sha256").update(secret).digest();
}

/** Encrypts provider secrets before they are persisted. Never send this value to a client. */
export function encryptMerchantSecret(value: string): string {
  const iv = randomBytes(IV_BYTES);
  const cipher = createCipheriv(ALGORITHM, key(), iv);
  const ciphertext = Buffer.concat([cipher.update(value, "utf8"), cipher.final()]);
  const tag = cipher.getAuthTag();
  return Buffer.concat([iv, tag, ciphertext]).toString("base64url");
}

export function decryptMerchantSecret(envelope: string): string {
  const raw = Buffer.from(envelope, "base64url");
  if (raw.length <= IV_BYTES + AUTH_TAG_BYTES) {
    throw new Error("La credencial cifrada del negocio no es válida");
  }
  const iv = raw.subarray(0, IV_BYTES);
  const tag = raw.subarray(IV_BYTES, IV_BYTES + AUTH_TAG_BYTES);
  const ciphertext = raw.subarray(IV_BYTES + AUTH_TAG_BYTES);
  const decipher = createDecipheriv(ALGORITHM, key(), iv);
  decipher.setAuthTag(tag);
  return Buffer.concat([decipher.update(ciphertext), decipher.final()]).toString("utf8");
}

export function sha256(value: string): string {
  return createHash("sha256").update(value).digest("hex");
}
