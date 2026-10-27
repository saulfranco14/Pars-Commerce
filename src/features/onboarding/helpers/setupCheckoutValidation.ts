import type { SetupCheckoutInput } from "@/features/onboarding/interfaces/setupCheckout";

export const needsPickupAddress = (fulfillment: string) => fulfillment === "pickup" || fulfillment === "onsite";

export function normalizeClabe(clabe: string): string {
  return clabe.replace(/\s/g, "");
}

/** First problem that would leave the storefront checkout unable to take this order, in the owner's words. */
export function setupCheckoutProblem(input: SetupCheckoutInput): string | null {
  if (input.step === "fulfillment") {
    if (needsPickupAddress(input.fulfillment) && !input.pickupPoint?.address_text?.trim()) {
      return "Busca y elige la dirección donde te encuentran tus clientes.";
    }
    if (input.fulfillment === "delivery") {
      if (!input.delivery?.area.trim()) return "Escribe la zona a la que entregas.";
      const fee = Number(input.delivery.fee || 0);
      if (!Number.isFinite(fee) || fee < 0) return "El costo de envío debe ser 0 o más.";
    }
    return null;
  }
  if (input.method === "transfer") {
    const transfer = input.transfer;
    if (!transfer?.bank_name.trim()) return "Escribe el banco de la cuenta.";
    if (!transfer.account_holder.trim()) return "Escribe el titular de la cuenta.";
    if (!/^\d{18}$/.test(normalizeClabe(transfer.clabe))) return "La CLABE debe tener 18 dígitos.";
  }
  return null;
}

const text = (value: unknown) => (typeof value === "string" ? value : "");
const optionalNumber = (value: unknown) => (typeof value === "number" && Number.isFinite(value) ? value : null);

/** Untrusted request body to a typed input, or null when it is not one of the wizard's two saves. */
export function parseSetupCheckoutInput(body: unknown): SetupCheckoutInput | null {
  if (!body || typeof body !== "object") return null;
  const raw = body as Record<string, unknown>;
  if (raw.step === "fulfillment" && (raw.fulfillment === "pickup" || raw.fulfillment === "delivery" || raw.fulfillment === "onsite")) {
    const point = (raw.pickupPoint ?? null) as Record<string, unknown> | null;
    const delivery = (raw.delivery ?? null) as Record<string, unknown> | null;
    return {
      step: "fulfillment",
      fulfillment: raw.fulfillment,
      pickupPoint: point
        ? {
            address_text: text(point.address_text),
            reference: text(point.reference),
            latitude: optionalNumber(point.latitude),
            longitude: optionalNumber(point.longitude),
            mapbox_feature_id: text(point.mapbox_feature_id) || null,
          }
        : null,
      delivery: delivery ? { area: text(delivery.area), fee: text(delivery.fee) } : null,
    };
  }
  if (raw.step === "payment" && (raw.method === "cash" || raw.method === "transfer" || raw.method === "digital")) {
    const transfer = (raw.transfer ?? null) as Record<string, unknown> | null;
    return {
      step: "payment",
      method: raw.method,
      transfer: transfer
        ? { bank_name: text(transfer.bank_name), account_holder: text(transfer.account_holder), clabe: text(transfer.clabe) }
        : null,
    };
  }
  return null;
}
