import { describe, expect, it } from "vitest";

import { orderAmountDue } from "@/features/orders/helpers/orderAmountDue";

describe("orderAmountDue", () => {
  it("is the total minus what was paid, whatever the stored balance says", () => {
    expect(orderAmountDue({ total: "1500.00", paid_total: "0.00" })).toBe(1500);
    expect(orderAmountDue({ total: 1500, paid_total: 500 })).toBe(1000);
    expect(orderAmountDue({ total: 300, paid_total: null })).toBe(300);
  });

  it("never goes below zero and keeps cents exact", () => {
    expect(orderAmountDue({ total: 100, paid_total: 120 })).toBe(0);
    expect(orderAmountDue({ total: 0.3, paid_total: 0.1 })).toBe(0.2);
  });
});
