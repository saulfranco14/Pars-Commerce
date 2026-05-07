export async function POST(request: Request) {
  const { executePublicCheckout } = await import(
    "@/features/checkout/services/publicCheckoutOrchestrator"
  );
  let body: Record<string, unknown> = {};
  try {
    body = (await request.json()) as Record<string, unknown>;
  } catch {
    body = {};
  }

  const modeOverride =
    body.payment_mode === "installments" ? "partial" : "subscription";

  const proxyRequest = new Request(request.url, {
    method: "POST",
    headers: request.headers,
    body: JSON.stringify({
      ...body,
      mode: modeOverride,
    }),
  });

  return executePublicCheckout({ request: proxyRequest, modeOverride });
}
