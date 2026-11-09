import { afterEach, describe, expect, it, vi } from "vitest";
import { studioMpRequest, verifyStudioPayment } from "./studioPaymentProvider";

vi.mock("@/features/payment-providers/tlacoBillingCredentials", () => ({
  getTlacoMercadoPagoAccessToken: () => "unit-test-only",
}));
afterEach(() => vi.unstubAllGlobals());

describe("Studio payment verification", () => {
  it("validates the account receiving the money and MXN before granting anything", async () => {
    const request = vi
      .fn()
      .mockImplementation(async () => Response.json({ id: 123 }));
    vi.stubGlobal("fetch", request);
    await expect(
      verifyStudioPayment({
        id: "p",
        status: "approved",
        currency_id: "MXN",
        collector_id: 123,
      }),
    ).resolves.toBeUndefined();
    await expect(
      verifyStudioPayment({
        id: "p",
        status: "approved",
        currency_id: "USD",
        collector_id: 123,
      }),
    ).rejects.toMatchObject({ code: "PAYMENT_MISMATCH" });
    await expect(
      verifyStudioPayment({
        id: "p",
        status: "approved",
        currency_id: "MXN",
        collector_id: 456,
      }),
    ).rejects.toMatchObject({ code: "PAYMENT_MISMATCH" });
    expect(
      request.mock.calls.every(
        ([url]) => url === "https://api.mercadopago.com/users/me",
      ),
    ).toBe(true);
  });
  it("never turns an unavailable provider resource into an approved payment", async () => {
    vi.stubGlobal(
      "fetch",
      vi
        .fn()
        .mockResolvedValue(
          Response.json({ error: "unavailable" }, { status: 503 }),
        ),
    );
    await expect(studioMpRequest("v1/payments/unknown")).rejects.toMatchObject({
      code: "PAYMENT_PROVIDER_ERROR",
      status: 502,
    });
  });
});
