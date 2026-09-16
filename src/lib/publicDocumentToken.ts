import { createHash, randomBytes } from "crypto";

/** Opaque bearer token. Database stores only its SHA-256 digest. */
export function createPublicDocumentToken() {
  const token = randomBytes(32).toString("base64url");
  return { token, tokenHash: hashPublicDocumentToken(token) };
}

export function hashPublicDocumentToken(token: string) {
  return createHash("sha256").update(token).digest("hex");
}
