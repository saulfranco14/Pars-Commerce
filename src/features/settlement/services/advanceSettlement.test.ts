import { describe, it, expect } from "vitest";
import { canTransition } from "@/features/settlement/services/advanceSettlement";

/**
 * S3 — the settlement lifecycle state machine. Pure. Freezes exactly which
 * transitions are legal, so no refactor can silently allow an illegal jump
 * (e.g. confirming a transfer on a still-open settlement — money marked paid
 * that was never closed).
 */
describe("canTransition (S3 lifecycle)", () => {
  it("allows the happy path step by step", () => {
    expect(canTransition("open", "closed")).toBe(true);
    expect(canTransition("closed", "transfer_pending")).toBe(true);
    expect(canTransition("transfer_pending", "transfer_confirmed")).toBe(true);
  });

  it("forbids skipping steps in the happy path", () => {
    expect(canTransition("open", "transfer_confirmed")).toBe(false);
    expect(canTransition("open", "transfer_pending")).toBe(false);
    expect(canTransition("closed", "transfer_confirmed")).toBe(false);
  });

  it("treats transfer_confirmed as terminal", () => {
    for (const to of ["open", "closed", "transfer_pending", "disputed"] as const) {
      expect(canTransition("transfer_confirmed", to)).toBe(false);
    }
  });

  it("allows disputing from any non-terminal state", () => {
    expect(canTransition("open", "disputed")).toBe(true);
    expect(canTransition("closed", "disputed")).toBe(true);
    expect(canTransition("transfer_pending", "disputed")).toBe(true);
  });

  it("lets a resolved dispute re-enter the flow at closed", () => {
    expect(canTransition("disputed", "closed")).toBe(true);
    expect(canTransition("disputed", "transfer_confirmed")).toBe(false);
  });

  it("forbids no-op transitions to the same state", () => {
    for (const s of ["open", "closed", "transfer_pending", "transfer_confirmed", "disputed"] as const) {
      expect(canTransition(s, s)).toBe(false);
    }
  });
});
