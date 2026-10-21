import { describe, expect, it } from "vitest";

import { counterMethodFor } from "@/features/orders/helpers/counterMethod";

describe("counterMethodFor", () => {
  it("keeps the method the customer chose at checkout", () => {
    expect(counterMethodFor("cash")).toBe("efectivo");
    expect(counterMethodFor("bank_transfer")).toBe("transferencia");
    expect(counterMethodFor("TARJETA")).toBe("tarjeta");
  });

  it("leaves the choice open when there is none the counter can take", () => {
    expect(counterMethodFor(null)).toBeNull();
    expect(counterMethodFor("mercadopago")).toBeNull();
    expect(counterMethodFor("")).toBeNull();
  });
});
