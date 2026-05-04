export type CheckoutFormPaymentMode = "single" | "subscription" | "partial";

export function normalizeLegacyMode(
  mode: "single" | "installments" | "recurring",
): CheckoutFormPaymentMode {
  if (mode === "installments") return "partial";
  if (mode === "recurring") return "subscription";
  return "single";
}

