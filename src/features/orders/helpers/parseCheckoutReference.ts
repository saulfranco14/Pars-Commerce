export interface ParsedCheckoutReference {
  orderId: string;
  mode: "single" | "subscription" | "partial" | "qr";
  attemptId: string;
  splitGroupId?: string;
}

export function parseCheckoutReference(
  value: string,
): ParsedCheckoutReference | null {
  const match = value.match(
    /^order:([a-f0-9-]+):mode:(single|subscription|partial|qr):attempt:([a-f0-9-]+)(?::split:([a-f0-9-]+))?$/i,
  );
  if (!match) return null;
  return {
    orderId: match[1],
    mode: match[2] as ParsedCheckoutReference["mode"],
    attemptId: match[3],
    splitGroupId: match[4] ?? undefined,
  };
}
