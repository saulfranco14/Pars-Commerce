import { describe, it, expect, vi, beforeEach } from "vitest";

/**
 * P1 — the webhook must return 5xx when processing FAILS, so MP retries the
 * event instead of dropping it (MP only retries on non-2xx). Before, a failed
 * handler was swallowed and the route returned 200 → the payment was lost.
 *
 * This is the one webhook route we unit-test by mocking its collaborators
 * (`paymentClient` + the handlers), because the HTTP status IS the behavior
 * that decides retry-vs-lost — worth the mocking here specifically.
 *
 * The signature check is skipped automatically: with no
 * MERCADOPAGO_WEBHOOK_SECRET and NODE_ENV !== "production", the route bypasses
 * verification (see route.ts:34-55).
 */

// --- mocks: control what MP "returns" and force a handler to fail ---
const getMock = vi.fn();
vi.mock("@/lib/mercadopago", () => ({
  paymentClient: { get: (...a: unknown[]) => getMock(...a) },
}));

const handleQrTableMpPayment = vi.fn();
vi.mock("@/features/qr/services/tableMpWebhookService", async (orig) => {
  const actual = (await orig()) as Record<string, unknown>;
  return { ...actual, handleQrTableMpPayment: (...a: unknown[]) => handleQrTableMpPayment(...a) };
});

// admin client isn't reached in these cases (handler is mocked), but the
// module imports it at top level — stub so import doesn't touch real env.
vi.mock("@/lib/supabase/admin", () => ({
  createAdminClient: () => ({}),
}));

import { POST } from "@/app/api/mercadopago/webhook/route";

function req(body: unknown): Request {
  return new Request("http://test/api/mercadopago/webhook", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify(body),
  });
}

beforeEach(() => {
  vi.clearAllMocks();
});

describe("webhook retry contract (P1)", () => {
  it("returns 500 when the handler throws → MP will retry", async () => {
    getMock.mockResolvedValue({
      id: "mp-1",
      external_reference: "qr_table:o1",
      status: "approved",
      transaction_amount: 100,
    });
    handleQrTableMpPayment.mockRejectedValueOnce(new Error("DB down"));

    const res = await POST(req({ type: "payment", data: { id: "mp-1" } }));
    expect(res.status).toBe(500);
  });

  it("returns 200 when processing succeeds", async () => {
    getMock.mockResolvedValue({
      id: "mp-1",
      external_reference: "qr_table:o1",
      status: "approved",
      transaction_amount: 100,
    });
    handleQrTableMpPayment.mockResolvedValueOnce(undefined);

    const res = await POST(req({ type: "payment", data: { id: "mp-1" } }));
    expect(res.status).toBe(200);
  });

  it("returns 200 for an ignorable event (not a payment) → no retry wanted", async () => {
    const res = await POST(req({ type: "some_other_event", data: { id: "x" } }));
    expect(res.status).toBe(200);
    // never even asked MP about a payment
    expect(getMock).not.toHaveBeenCalled();
  });

  it("returns 200 when the MP payment has no external_reference (nothing to route)", async () => {
    getMock.mockResolvedValue({ id: "mp-1", status: "approved" });
    const res = await POST(req({ type: "payment", data: { id: "mp-1" } }));
    expect(res.status).toBe(200);
  });
});
