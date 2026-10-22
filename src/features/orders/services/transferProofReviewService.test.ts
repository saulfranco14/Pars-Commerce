import { beforeEach, describe, expect, it, vi } from "vitest";

import { createFakeSupabase } from "@/test/fakeSupabase";

import { reviewTransferProof } from "@/features/orders/services/transferProofReviewService";

import type { createAdminClient } from "@/lib/supabase/admin";

const roles: Record<string, { roleName: string; permissions: string[] }> = {
  cashier: { roleName: "cajero", permissions: ["payments.write"] },
  courier: { roleName: "repartidor", permissions: ["orders.deliver"] },
};

vi.mock("@/lib/auth/requirePermission", () => ({
  getTenantRole: vi.fn(async (userId: string) =>
    roles[userId] ? { membershipId: "m", roleId: "r", ...roles[userId] } : null,
  ),
}));

type Fake = ReturnType<typeof createFakeSupabase>;
const asAdmin = (db: Fake) => db as unknown as ReturnType<typeof createAdminClient>;

let db: Fake;
beforeEach(() => {
  db = createFakeSupabase({
    orders: [{ id: "o1", tenant_id: "t1", total: 349, status: "pending_payment", payment_verification_status: "proof_submitted" }],
    order_transfer_proofs: [{ id: "p1", order_id: "o1", status: "pending_review" }],
    payments: [],
  });
});

describe("reviewTransferProof", () => {
  it("whoever collects money can approve: the order is paid and the payment recorded once", async () => {
    const input = { userId: "cashier", orderId: "o1", proofId: "p1", decision: "approve" as const };
    expect(await reviewTransferProof(asAdmin(db), input)).toEqual({ ok: true, data: { status: "approved" } });
    expect(db.rowsOf("orders")[0]).toMatchObject({ payment_verification_status: "approved", paid_total: 349, balance_due: 0 });
    expect(db.rowsOf("payments")).toEqual([expect.objectContaining({ provider: "bank_transfer", amount: 349, status: "approved" })]);

    // A second tap finds nothing pending: no second payment.
    expect(await reviewTransferProof(asAdmin(db), input)).toMatchObject({ ok: false, error: { code: "conflict" } });
    expect(db.rowsOf("payments")).toHaveLength(1);
  });

  it("rejecting asks for the reason the customer will read and leaves the order unpaid", async () => {
    const base = { userId: "cashier", orderId: "o1", proofId: "p1", decision: "reject" as const };
    expect(await reviewTransferProof(asAdmin(db), base)).toMatchObject({ ok: false, error: { code: "validation" } });
    expect(await reviewTransferProof(asAdmin(db), { ...base, rejectionReason: "No llegó" })).toMatchObject({ ok: true });
    expect(db.rowsOf("order_transfer_proofs")[0]).toMatchObject({ status: "rejected", rejection_reason: "No llegó" });
    expect(db.rowsOf("orders")[0]).toMatchObject({ payment_verification_status: "rejected", status: "pending_payment" });
    expect(db.rowsOf("payments")).toEqual([]);
  });

  it("a role that neither attends nor collects can't review", async () => {
    const result = await reviewTransferProof(asAdmin(db), { userId: "courier", orderId: "o1", proofId: "p1", decision: "approve" });
    expect(result).toMatchObject({ ok: false, error: { code: "forbidden" } });
    expect(db.rowsOf("order_transfer_proofs")[0]).toMatchObject({ status: "pending_review" });
  });
});
