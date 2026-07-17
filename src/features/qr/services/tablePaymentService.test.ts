import { describe, it, expect } from "vitest";
import type { SupabaseClient } from "@supabase/supabase-js";
import { createFakeSupabase } from "@/test/fakeSupabase";
import {
  areAllSplitGroupsPaid,
  confirmPayment,
  payGroup,
} from "@/features/qr/services/tablePaymentService";

/**
 * CHARACTERIZATION tests — they freeze how the code behaves TODAY, so the
 * upcoming refactor of this file can be verified as behavior-preserving.
 * They intentionally assert current behavior (even the debatable bits, like
 * "zero groups ⇒ allPaid true"), NOT what the code "should" do in the
 * abstract. If a test goes red after a refactor, the refactor changed
 * behavior — decide on purpose, don't just update the test.
 *
 * All unit-level: the fake client stands in for Supabase (no DB).
 */

// Cast helper: the fake implements only the chain surface these services use.
const asClient = (db: ReturnType<typeof createFakeSupabase>) =>
  db as unknown as SupabaseClient;

describe("areAllSplitGroupsPaid (T1.1)", () => {
  it("returns true when every group is paid", async () => {
    const db = createFakeSupabase({
      order_split_groups: [
        { id: "g1", order_id: "o1", payment_status: "paid" },
        { id: "g2", order_id: "o1", payment_status: "paid" },
      ],
    });
    expect(await areAllSplitGroupsPaid(asClient(db), "o1")).toBe(true);
  });

  it("returns false when any group is still pending", async () => {
    const db = createFakeSupabase({
      order_split_groups: [
        { id: "g1", order_id: "o1", payment_status: "paid" },
        { id: "g2", order_id: "o1", payment_status: "pending" },
      ],
    });
    expect(await areAllSplitGroupsPaid(asClient(db), "o1")).toBe(false);
  });

  it("returns true for zero groups — CURRENT behavior of .every over empty (frozen)", async () => {
    const db = createFakeSupabase({ order_split_groups: [] });
    expect(await areAllSplitGroupsPaid(asClient(db), "o1")).toBe(true);
  });

  it("only counts groups of the given order", async () => {
    const db = createFakeSupabase({
      order_split_groups: [
        { id: "g1", order_id: "o1", payment_status: "paid" },
        { id: "g2", order_id: "o2", payment_status: "pending" }, // other order
      ],
    });
    expect(await areAllSplitGroupsPaid(asClient(db), "o1")).toBe(true);
  });
});

describe("confirmPayment (T1.2)", () => {
  it("returns not_found when the payment does not exist", async () => {
    const db = createFakeSupabase({ payments: [] });
    const res = await confirmPayment(asClient(db), {
      paymentId: "nope",
      actorUserId: "u1",
    });
    expect(res).toEqual({
      ok: false,
      error: { code: "not_found", message: "Pago no encontrado" },
    });
  });

  it("is idempotent: an already-approved payment early-returns without re-writing", async () => {
    const db = createFakeSupabase({
      payments: [
        { id: "p1", order_id: "o1", split_group_id: null, amount: 100, status: "approved", metadata: null },
      ],
    });
    const res = await confirmPayment(asClient(db), {
      paymentId: "p1",
      actorUserId: "u1",
    });
    expect(res).toEqual({ ok: true, data: { allPaid: false, orderId: "o1" } });
    // No writes at all — it returned before touching anything.
    expect(db.writes).toHaveLength(0);
  });

  it("confirming the LAST pending split group marks the order paid (allPaid true)", async () => {
    const db = createFakeSupabase({
      payments: [
        { id: "p1", order_id: "o1", split_group_id: "g1", amount: 50, status: "pending", metadata: { method: "efectivo" } },
      ],
      orders: [{ id: "o1", total: 50, status: "pending_payment", qr_code_id: null }],
      order_split_groups: [
        // after this payment's group is marked paid, all groups are paid
        { id: "g1", order_id: "o1", total: 50, payment_status: "pending" },
      ],
    });

    const res = await confirmPayment(asClient(db), {
      paymentId: "p1",
      actorUserId: "u1",
    });

    expect(res.ok).toBe(true);
    expect(res.ok && res.data.allPaid).toBe(true);
    // payment approved
    expect(db.rowsOf("payments")[0].status).toBe("approved");
    // group marked paid
    expect(db.rowsOf("order_split_groups")[0].payment_status).toBe("paid");
    // order marked paid
    expect(db.rowsOf("orders")[0].status).toBe("paid");
    // activity logged
    expect(
      db.writes.some(
        (w) => w.table === "order_activity_log" && w.op === "insert",
      ),
    ).toBe(true);
  });

  it("confirming one group while others remain pending does NOT mark the order paid", async () => {
    const db = createFakeSupabase({
      payments: [
        { id: "p1", order_id: "o1", split_group_id: "g1", amount: 50, status: "pending", metadata: { method: "efectivo" } },
      ],
      orders: [{ id: "o1", total: 100, status: "pending_payment", qr_code_id: null }],
      order_split_groups: [
        { id: "g1", order_id: "o1", total: 50, payment_status: "pending" },
        { id: "g2", order_id: "o1", total: 50, payment_status: "pending" }, // stays pending
      ],
    });

    const res = await confirmPayment(asClient(db), {
      paymentId: "p1",
      actorUserId: "u1",
    });

    expect(res.ok && res.data.allPaid).toBe(false);
    // order NOT marked paid
    expect(db.rowsOf("orders")[0].status).toBe("pending_payment");
    // but the confirmed group IS paid
    const g1 = db.rowsOf("order_split_groups").find((g) => g.id === "g1");
    expect(g1?.payment_status).toBe("paid");
  });
});

describe("payGroup (T1.3)", () => {
  it("returns not_found when the group does not exist", async () => {
    const db = createFakeSupabase({ order_split_groups: [] });
    const res = await payGroup(asClient(db), { groupId: "nope", method: "efectivo" });
    expect(res).toEqual({
      ok: false,
      error: { code: "not_found", message: "Grupo no encontrado" },
    });
  });

  it("is idempotent: an already-paid group early-returns amount 0, no writes", async () => {
    const db = createFakeSupabase({
      order_split_groups: [
        { id: "g1", order_id: "o1", device_id: null, total: 50, paid_total: 50, balance_due: 0, payment_status: "paid" },
      ],
    });
    const res = await payGroup(asClient(db), { groupId: "g1", method: "efectivo" });
    expect(res).toEqual({ ok: true, data: { allPaid: false, amount: 0 } });
    expect(db.writes).toHaveLength(0);
  });

  it("blocks payment when the order is not ready (fulfillment gate, no device)", async () => {
    const db = createFakeSupabase({
      order_split_groups: [
        { id: "g1", order_id: "o1", device_id: null, total: 50, paid_total: 0, balance_due: 50, payment_status: "pending" },
      ],
      orders: [{ id: "o1", fulfillment_status: "in_progress" }], // NOT ready
    });
    const res = await payGroup(asClient(db), { groupId: "g1", method: "efectivo" });
    expect(res.ok).toBe(false);
    expect(res.ok === false && res.error.code).toBe("conflict");
    // gate hit before any write
    expect(db.writes).toHaveLength(0);
  });

  it("pays the last pending group → group + order marked paid, allPaid true", async () => {
    const db = createFakeSupabase({
      order_split_groups: [
        { id: "g1", order_id: "o1", device_id: null, total: 50, paid_total: 0, balance_due: 50, payment_status: "pending" },
      ],
      orders: [{ id: "o1", total: 50, status: "pending_payment", fulfillment_status: "ready", qr_code_id: null }],
    });

    const res = await payGroup(asClient(db), { groupId: "g1", method: "efectivo" });

    expect(res.ok).toBe(true);
    expect(res.ok && res.data.allPaid).toBe(true);
    expect(res.ok && res.data.amount).toBe(50);
    expect(db.rowsOf("order_split_groups")[0].payment_status).toBe("paid");
    expect(db.rowsOf("orders")[0].status).toBe("paid");
    // a payment row was inserted
    expect(
      db.writes.some((w) => w.table === "payments" && w.op === "insert"),
    ).toBe(true);
  });

  it("pays one group with others pending → group paid, order NOT paid, allPaid false", async () => {
    const db = createFakeSupabase({
      order_split_groups: [
        { id: "g1", order_id: "o1", device_id: null, total: 50, paid_total: 0, balance_due: 50, payment_status: "pending" },
        { id: "g2", order_id: "o1", device_id: null, total: 50, paid_total: 0, balance_due: 50, payment_status: "pending" },
      ],
      orders: [{ id: "o1", total: 100, status: "pending_payment", fulfillment_status: "ready", qr_code_id: null }],
    });

    const res = await payGroup(asClient(db), { groupId: "g1", method: "efectivo" });

    expect(res.ok && res.data.allPaid).toBe(false);
    expect(db.rowsOf("orders")[0].status).toBe("pending_payment");
    const g1 = db.rowsOf("order_split_groups").find((g) => g.id === "g1");
    expect(g1?.payment_status).toBe("paid");
  });

  it("per-device gate: pays when THAT device is ready even if order-level isn't", async () => {
    const db = createFakeSupabase({
      order_split_groups: [
        { id: "g1", order_id: "o1", device_id: "d1", total: 50, paid_total: 0, balance_due: 50, payment_status: "pending" },
      ],
      order_devices: [{ id: "d1", fulfillment_status: "ready" }],
      orders: [{ id: "o1", total: 50, status: "pending_payment", fulfillment_status: "in_progress", qr_code_id: null }],
    });

    const res = await payGroup(asClient(db), { groupId: "g1", method: "efectivo" });
    // device ready → allowed to pay despite order-level not ready
    expect(res.ok).toBe(true);
    expect(db.rowsOf("order_split_groups")[0].payment_status).toBe("paid");
  });
});
