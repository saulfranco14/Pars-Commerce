import { describe, it, expect } from "vitest";
import type { SupabaseClient } from "@supabase/supabase-js";
import { createFakeSupabase } from "@/test/fakeSupabase";
import {
  isQrTableReference,
  handleQrTableMpPayment,
} from "@/features/qr/services/tableMpWebhookService";

/**
 * CHARACTERIZATION (E2) of the QR-table MP webhook settle path. Freezes how it
 * behaves TODAY so the P1/P2 hardening (external_id + 23505 idempotency) can be
 * verified as behavior-preserving where it should be, and intentionally
 * changing only what we mean to change.
 *
 * Unit level: the fake client stands in for Supabase.
 */
const asClient = (db: ReturnType<typeof createFakeSupabase>) =>
  db as unknown as SupabaseClient;

describe("isQrTableReference", () => {
  it("recognizes both full-order and split-group prefixes", () => {
    expect(isQrTableReference("qr_table:o1")).toBe(true);
    expect(isQrTableReference("qr_table_group:g1")).toBe(true);
    expect(isQrTableReference("loan:x")).toBe(false);
  });
});

describe("handleQrTableMpPayment — full order (E2)", () => {
  it("settles the order: marks paid + inserts a payment + logs", async () => {
    const db = createFakeSupabase({
      orders: [{ id: "o1", status: "pending_payment", total: 100, qr_code_id: null }],
    });

    await handleQrTableMpPayment({
      admin: asClient(db),
      externalReference: "qr_table:o1",
      mpPaymentId: "mp-123",
      amount: 100,
    });

    expect(db.rowsOf("orders")[0].status).toBe("paid");
    const payment = db.writes.find((w) => w.table === "payments" && w.op === "insert");
    expect(payment).toBeTruthy();
    expect(
      db.writes.some((w) => w.table === "order_activity_log" && w.op === "insert"),
    ).toBe(true);
  });

  it("is idempotent: an already-paid order is a no-op (no writes)", async () => {
    const db = createFakeSupabase({
      orders: [{ id: "o1", status: "paid", total: 100, qr_code_id: null }],
    });

    await handleQrTableMpPayment({
      admin: asClient(db),
      externalReference: "qr_table:o1",
      mpPaymentId: "mp-123",
      amount: 100,
    });

    // Early `if (order.status === "paid") return` → nothing written.
    expect(db.writes).toHaveLength(0);
  });

  it("does nothing when the order does not exist (money-in-MP-only risk, frozen)", async () => {
    const db = createFakeSupabase({ orders: [] });

    await handleQrTableMpPayment({
      admin: asClient(db),
      externalReference: "qr_table:missing",
      mpPaymentId: "mp-123",
      amount: 100,
    });

    // Current behavior: `if (!order) return` → silent no-op. Frozen so a
    // refactor can't make it WORSE without a test going red. (The real fix
    // for "MP has the money, we don't" is the reconciler, not here.)
    expect(db.writes).toHaveLength(0);
  });
});

describe("handleQrTableMpPayment — split group (E2)", () => {
  it("settles the group; marks order paid only when all groups are paid", async () => {
    const db = createFakeSupabase({
      order_split_groups: [
        { id: "g1", order_id: "o1", total: 50, payment_status: "pending" },
      ],
      orders: [{ id: "o1", status: "pending_payment", total: 50, qr_code_id: null }],
    });

    await handleQrTableMpPayment({
      admin: asClient(db),
      externalReference: "qr_table_group:g1",
      mpPaymentId: "mp-456",
      amount: 50,
    });

    expect(db.rowsOf("order_split_groups")[0].payment_status).toBe("paid");
    // only group → all paid → order paid
    expect(db.rowsOf("orders")[0].status).toBe("paid");
  });

  it("leaves the order unpaid when another group is still pending", async () => {
    const db = createFakeSupabase({
      order_split_groups: [
        { id: "g1", order_id: "o1", total: 50, payment_status: "pending" },
        { id: "g2", order_id: "o1", total: 50, payment_status: "pending" },
      ],
      orders: [{ id: "o1", status: "pending_payment", total: 100, qr_code_id: null }],
    });

    await handleQrTableMpPayment({
      admin: asClient(db),
      externalReference: "qr_table_group:g1",
      mpPaymentId: "mp-456",
      amount: 50,
    });

    expect(db.rowsOf("order_split_groups").find((g) => g.id === "g1")?.payment_status).toBe("paid");
    expect(db.rowsOf("orders")[0].status).toBe("pending_payment");
  });
});
