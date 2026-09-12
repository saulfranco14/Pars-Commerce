import { describe, it, expect } from "vitest";
import {
  calcPlatformCommission,
  PLATFORM_COMMISSION_BY_CYCLE,
} from "@/constants/platformCommission";

/**
 * S2 — platform commission by settlement frequency. Pure function, money path,
 * so every branch is covered: each cycle's %, override, the custom-requires-
 * override rule, rounding, and invalid inputs.
 */
describe("calcPlatformCommission (S2)", () => {
  it("applies the daily rate (highest — least float retained)", () => {
    const r = calcPlatformCommission(1000, "daily");
    expect(r.commissionPercent).toBe(0.035);
    expect(r.commissionAmount).toBe(35);
    expect(r.amountToTransfer).toBe(965);
  });

  it("applies the monthly rate (lowest — most float retained)", () => {
    const r = calcPlatformCommission(1000, "monthly");
    expect(r.commissionPercent).toBe(0.02);
    expect(r.commissionAmount).toBe(20);
    expect(r.amountToTransfer).toBe(980);
  });

  it("less frequent cycle → strictly lower commission (the core incentive)", () => {
    const amt = 1000;
    const daily = calcPlatformCommission(amt, "daily").commissionAmount;
    const weekly = calcPlatformCommission(amt, "weekly").commissionAmount;
    const biweekly = calcPlatformCommission(amt, "biweekly").commissionAmount;
    const monthly = calcPlatformCommission(amt, "monthly").commissionAmount;
    expect(daily).toBeGreaterThan(weekly);
    expect(weekly).toBeGreaterThan(biweekly);
    expect(biweekly).toBeGreaterThan(monthly);
  });

  it("every non-custom cycle has a configured rate", () => {
    for (const cycle of ["daily", "weekly", "biweekly", "monthly"] as const) {
      expect(PLATFORM_COMMISSION_BY_CYCLE[cycle]).toBeGreaterThan(0);
      expect(() => calcPlatformCommission(100, cycle)).not.toThrow();
    }
  });

  it("custom cycle REQUIRES an override percent", () => {
    expect(() => calcPlatformCommission(1000, "custom")).toThrow(
      /custom.*requiere.*overridePercent/i,
    );
  });

  it("custom cycle works with a contract override", () => {
    const r = calcPlatformCommission(1000, "custom", 0.015);
    expect(r.commissionPercent).toBe(0.015);
    expect(r.commissionAmount).toBe(15);
    expect(r.amountToTransfer).toBe(985);
  });

  it("override wins over the cycle default when provided", () => {
    const r = calcPlatformCommission(1000, "daily", 0.01);
    expect(r.commissionPercent).toBe(0.01); // not 0.035
    expect(r.amountToTransfer).toBe(990);
  });

  it("rounds commission and transfer to cents", () => {
    // 333.33 * 3.5% = 11.66655 → 11.67
    const r = calcPlatformCommission(333.33, "daily");
    expect(r.commissionAmount).toBe(11.67);
    expect(r.amountToTransfer).toBe(321.66);
  });

  it("zero net → zero commission, zero transfer", () => {
    const r = calcPlatformCommission(0, "daily");
    expect(r.commissionAmount).toBe(0);
    expect(r.amountToTransfer).toBe(0);
  });

  it("rejects a negative net amount", () => {
    expect(() => calcPlatformCommission(-1, "daily")).toThrow(/negativo/i);
  });

  it("rejects an out-of-range override", () => {
    expect(() => calcPlatformCommission(100, "daily", 1.5)).toThrow(/entre 0 y 1/i);
    expect(() => calcPlatformCommission(100, "daily", -0.1)).toThrow(/entre 0 y 1/i);
  });
});
