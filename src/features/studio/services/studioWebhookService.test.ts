import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  request: vi.fn(),
  verify: vi.fn(),
  rpc: vi.fn(),
  from: vi.fn(),
}));
vi.mock("./studioPaymentProvider", () => ({
  studioMpRequest: mocks.request,
  verifyStudioPayment: mocks.verify,
}));
vi.mock("./studioDb", () => ({
  studioDb: () => ({ from: mocks.from, rpc: mocks.rpc }),
}));
import { handleStudioMpResource } from "./studioWebhookService";

beforeEach(() => {
  vi.resetAllMocks();
  mocks.verify.mockResolvedValue(undefined);
});
describe("Studio verified webhook dispatch", () => {
  it("does not activate a membership when its preapproval is merely authorized", async () => {
    mocks.request.mockResolvedValue({
      id: "pre",
      status: "authorized",
      external_reference: "studio_subscription:sub",
    });
    mocks.from.mockReturnValue({
      select: () => ({
        eq: () => ({
          single: async () => ({
            data: { id: "sub", mp_preapproval_id: "pre" },
            error: null,
          }),
        }),
      }),
    });
    expect(
      await handleStudioMpResource("subscription_preapproval", "pre"),
    ).toBe(true);
    expect(mocks.rpc).not.toHaveBeenCalled();
  });
  it("does not grant anything for a payment still pending", async () => {
    mocks.request.mockResolvedValue({
      id: "pay",
      status: "pending",
      external_reference: "studio_credit_pack:order",
    });
    expect(await handleStudioMpResource("payment", "pay")).toBe(true);
    expect(mocks.rpc).not.toHaveBeenCalled();
  });
  it("rejects a verification failure before touching the wallet", async () => {
    mocks.request.mockResolvedValue({
      id: "pay",
      status: "approved",
      external_reference: "studio_credit_pack:order",
      date_approved: "2026-11-01T18:00:00Z",
    });
    mocks.verify.mockRejectedValue(new Error("Receiver mismatch"));
    await expect(handleStudioMpResource("payment", "pay")).rejects.toThrow(
      "Receiver mismatch",
    );
    expect(mocks.rpc).not.toHaveBeenCalled();
  });
  it("returns an already recorded approved payment without reconstructing an incomplete billing period", async () => {
    mocks.request.mockResolvedValue({
      id: "pay",
      status: "approved",
      external_reference: "studio_subscription:sub",
      date_approved: "2026-11-01T18:00:00Z",
    });
    mocks.from.mockReturnValue({
      select: () => ({
        eq: () => ({
          maybeSingle: async () => ({ data: { id: "recorded" }, error: null }),
        }),
      }),
    });
    expect(await handleStudioMpResource("payment", "pay")).toBe(true);
    expect(mocks.rpc).not.toHaveBeenCalled();
  });
  it("leaves unrelated merchant payments to the existing order handlers", async () => {
    mocks.request.mockResolvedValue({
      id: "pay",
      status: "approved",
      external_reference: "order:merchant-order",
    });
    expect(await handleStudioMpResource("payment", "pay")).toBe(false);
    expect(mocks.verify).not.toHaveBeenCalled();
    expect(mocks.rpc).not.toHaveBeenCalled();
  });
});
