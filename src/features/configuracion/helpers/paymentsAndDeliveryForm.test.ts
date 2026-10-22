import { describe, expect, it } from "vitest";

import {
  EMPTY_PAYMENTS_AND_DELIVERY,
  toPaymentsAndDeliveryForm,
  validatePickupPoint,
} from "@/features/configuracion/helpers/paymentsAndDeliveryForm";

const snapshot = {
  settings: { delivery_enabled: true, delivery_fee: 45, delivery_area_label: "Neza", pickup_enabled: true },
  pickupPoints: [{ name: "Centro", address_text: "Av. 1" }, { name: "", address_text: "" }],
  paymentMethods: [
    { id: "t", kind: "bank_transfer" as const, label: null, bank_name: "BBVA", account_holder: "Ana", clabe: "012", account_number: null, is_active: true },
    { id: "c", kind: "cash" as const, label: null, bank_name: null, account_holder: null, clabe: null, account_number: null, is_active: false },
  ],
  onlinePaymentConnected: false,
  businessHours: null,
};

describe("toPaymentsAndDeliveryForm", () => {
  it("keeps online payment on unless it was turned off, and drops empty pickup points", () => {
    const form = toPaymentsAndDeliveryForm(snapshot);
    expect(form.online_payment_enabled).toBe(true);
    expect(form.delivery_fee).toBe("45");
    expect(form.pickup_points).toEqual([{ name: "Centro", address_text: "Av. 1" }]);
    expect(form.transfer).toMatchObject({ id: "t", enabled: true, label: "Transferencia SPEI", bank_name: "BBVA" });
    expect(form.cash_enabled).toBe(false);
  });

  it("without saved methods it starts from the empty transfer", () => {
    const form = toPaymentsAndDeliveryForm({ ...snapshot, settings: null, paymentMethods: [] });
    expect(form.transfer).toEqual(EMPTY_PAYMENTS_AND_DELIVERY.transfer);
    expect(form.delivery_enabled).toBe(false);
  });
});

describe("validatePickupPoint", () => {
  it("asks for name and address, and trims them", () => {
    expect(validatePickupPoint({ name: " ", address_text: "Av. 1" })).toEqual({ ok: false, message: "Agrega el nombre y la dirección del punto." });
    expect(validatePickupPoint({ name: " Centro ", address_text: " Av. 1 " })).toEqual({ ok: true, point: { name: "Centro", address_text: "Av. 1" } });
  });
});
