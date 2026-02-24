import crypto from "crypto";

export function verifyWebhookSignature(
  body: { data?: { id?: string } },
  xSignature: string | null,
  xRequestId: string | null,
  secret: string
): boolean {
  if (!secret || !xSignature) return false;
  const dataId = body.data?.id?.toLowerCase() ?? "";
  const parts = xSignature.split(",");
  let ts = "";
  let v1 = "";
  for (const p of parts) {
    const [k, v] = p.split("=");
    const key = k?.trim();
    const val = v?.trim() ?? "";
    if (key === "ts") ts = val;
    if (key === "v1") v1 = val;
  }
  const manifest = `id:${dataId};request-id:${xRequestId ?? ""};ts:${ts};`;
  const computed = crypto
    .createHmac("sha256", secret)
    .update(manifest)
    .digest("hex");
  return computed === v1 && v1.length > 0;
}
