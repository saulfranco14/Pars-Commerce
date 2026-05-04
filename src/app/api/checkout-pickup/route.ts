export async function POST(request: Request) {
  const { executePublicCheckout } = await import(
    "@/features/checkout/services/publicCheckoutOrchestrator"
  );
  return executePublicCheckout({ request, modeOverride: "single" });
}
