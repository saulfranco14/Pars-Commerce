import { describe, expect, it } from "vitest";

import { parseSetupCheckoutInput, setupCheckoutProblem } from "@/features/onboarding/helpers/setupCheckoutValidation";

describe("setupCheckoutProblem", () => {
  it("asks for an address when customers come to the business", () => {
    expect(setupCheckoutProblem({ step: "fulfillment", fulfillment: "pickup", pickupPoint: { address_text: "" } })).toMatch(/dirección/);
    expect(setupCheckoutProblem({ step: "fulfillment", fulfillment: "onsite", pickupPoint: null })).toMatch(/dirección/);
    expect(setupCheckoutProblem({ step: "fulfillment", fulfillment: "pickup", pickupPoint: { address_text: "Callejón Rosario 4" } })).toBeNull();
  });

  it("asks for a zone and a valid fee for local delivery", () => {
    expect(setupCheckoutProblem({ step: "fulfillment", fulfillment: "delivery", delivery: { area: "", fee: "" } })).toMatch(/zona/);
    expect(setupCheckoutProblem({ step: "fulfillment", fulfillment: "delivery", delivery: { area: "Chimalhuacán", fee: "-5" } })).toMatch(/costo/);
    expect(setupCheckoutProblem({ step: "fulfillment", fulfillment: "delivery", delivery: { area: "Chimalhuacán", fee: "" } })).toBeNull();
  });

  it("requires complete bank data for transfers", () => {
    const transfer = { bank_name: "BBVA", account_holder: "Claudia López", clabe: "0121 8000 1234 5678 90" };
    expect(setupCheckoutProblem({ step: "payment", method: "transfer", transfer: { ...transfer, clabe: "123" } })).toMatch(/18 dígitos/);
    expect(setupCheckoutProblem({ step: "payment", method: "transfer", transfer })).toBeNull();
    expect(setupCheckoutProblem({ step: "payment", method: "cash" })).toBeNull();
  });
});

describe("parseSetupCheckoutInput", () => {
  it("accepts the wizard's two saves and drops anything else", () => {
    expect(parseSetupCheckoutInput({ step: "payment", method: "cash" })).toEqual({ step: "payment", method: "cash", transfer: null });
    expect(parseSetupCheckoutInput({ step: "payment", method: "crypto" })).toBeNull();
    expect(parseSetupCheckoutInput({ step: "fulfillment", fulfillment: "pickup", pickupPoint: { address_text: "Centro", latitude: "x" } })).toMatchObject({
      pickupPoint: { address_text: "Centro", latitude: null },
    });
  });
});
