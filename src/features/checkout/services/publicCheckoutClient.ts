import type {
  PublicCheckoutPayload,
  PublicCheckoutResponse,
} from "@/features/checkout/interfaces/publicCheckout";

function getHeaders(fingerprintId: string): HeadersInit {
  return {
    "Content-Type": "application/json",
    "x-fingerprint-id": fingerprintId,
    "x-idempotency-key": `checkout-${Date.now()}-${Math.random().toString(36).slice(2, 10)}`,
  };
}

export async function checkoutPublic(
  payload: PublicCheckoutPayload,
  fingerprintId: string,
): Promise<PublicCheckoutResponse> {
  const res = await fetch("/api/public-checkout", {
    method: "POST",
    headers: getHeaders(fingerprintId),
    body: JSON.stringify(payload),
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    throw new Error(
      typeof (data as { error?: string }).error === "string"
        ? (data as { error: string }).error
        : res.statusText,
    );
  }
  return data as PublicCheckoutResponse;
}

