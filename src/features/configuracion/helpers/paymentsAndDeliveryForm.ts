import type {
  PaymentsAndDeliveryForm,
  PaymentsAndDeliverySnapshot,
  PickupPointDraft,
} from "@/features/configuracion/interfaces/paymentsAndDelivery";

export const EMPTY_PAYMENTS_AND_DELIVERY: PaymentsAndDeliveryForm = {
  online_payment_enabled: true,
  delivery_enabled: false,
  delivery_fee: "",
  delivery_area_label: "",
  pickup_enabled: false,
  pickup_points: [],
  transfer: { enabled: false, label: "Transferencia SPEI", bank_name: "", account_holder: "", clabe: "", account_number: "" },
  cash_enabled: false,
};

export function newPickupPoint(): PickupPointDraft {
  return {
    name: "",
    address_text: "",
    reference: "",
    instructions: "",
    mapbox_feature_id: null,
    latitude: null,
    longitude: null,
    business_hours: null,
  };
}

/** The editable form from what is saved; online payment stays on unless it was turned off. */
export function toPaymentsAndDeliveryForm(saved: PaymentsAndDeliverySnapshot): PaymentsAndDeliveryForm {
  const transfer = saved.paymentMethods.find((method) => method.kind === "bank_transfer");
  const cash = saved.paymentMethods.find((method) => method.kind === "cash");
  return {
    online_payment_enabled: saved.settings?.online_payment_enabled !== false,
    delivery_enabled: Boolean(saved.settings?.delivery_enabled),
    delivery_fee: String(saved.settings?.delivery_fee ?? ""),
    delivery_area_label: saved.settings?.delivery_area_label ?? "",
    pickup_enabled: Boolean(saved.settings?.pickup_enabled),
    pickup_points: saved.pickupPoints.filter((point) => point.name || point.address_text),
    transfer: transfer
      ? {
          id: transfer.id,
          enabled: Boolean(transfer.is_active),
          label: transfer.label ?? "Transferencia SPEI",
          bank_name: transfer.bank_name ?? "",
          account_holder: transfer.account_holder ?? "",
          clabe: transfer.clabe ?? "",
          account_number: transfer.account_number ?? "",
        }
      : EMPTY_PAYMENTS_AND_DELIVERY.transfer,
    cash_enabled: Boolean(cash?.is_active),
  };
}

/** A point needs a name and an address; returns the trimmed point or the message to show. */
export function validatePickupPoint(point: PickupPointDraft): { ok: true; point: PickupPointDraft } | { ok: false; message: string } {
  const clean = { ...point, name: point.name?.trim() ?? "", address_text: point.address_text?.trim() ?? "" };
  if (!clean.name || !clean.address_text) return { ok: false, message: "Agrega el nombre y la dirección del punto." };
  return { ok: true, point: clean };
}
