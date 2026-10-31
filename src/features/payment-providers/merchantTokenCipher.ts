import { createHash } from "node:crypto";

import { SEAL_OVERHEAD_BYTES, deriveKey, open, seal } from "@/lib/crypto/secretBox";

function key(): Buffer {
  const secret = process.env.MERCHANT_TOKEN_ENCRYPTION_KEY;
  if (!secret || secret.length < 32) {
    throw new Error(
      "MERCHANT_TOKEN_ENCRYPTION_KEY debe tener al menos 32 caracteres para conectar cobros",
    );
  }
  return deriveKey(secret);
}

/** Encrypts provider secrets before they are persisted. Never send this value to a client. */
export function encryptMerchantSecret(value: string): string {
  return seal(value, key());
}

export function decryptMerchantSecret(envelope: string): string {
  if (Buffer.from(envelope, "base64url").length <= SEAL_OVERHEAD_BYTES) {
    throw new Error("La credencial cifrada del negocio no es válida");
  }
  return open(envelope, key());
}

export function sha256(value: string): string {
  return createHash("sha256").update(value).digest("hex");
}
