import { describe, it, expect } from "vitest";
import { parseCheckoutReference } from "@/features/orders/helpers/parseCheckoutReference";
import { isQrTableReference } from "@/features/qr/services/tableMpWebhookService";

/**
 * CHARACTERIZATION of the webhook's DISPATCH decision (T1.4).
 *
 * Scope note (honest): the webhook `POST` itself is not unit-tested here.
 * It depends on a live `paymentClient.get()` call to MercadoPago and on
 * directly-imported handler modules — mocking all of that tests the mocks
 * more than the code. Instead we test the PURE functions that DECIDE which
 * flow an `external_reference` routes to. Those encode the routing rules
 * (`ARCHITECTURE.md §6.1`); a refactor of the webhook that changed how a
 * reference is classified would break these. End-to-end dispatch (incl. the
 * 401-on-bad-signature we already saw manually) is covered by manual
 * browser/curl verification, not this layer.
 */

describe("webhook dispatch: reference classification (T1.4)", () => {
  it("classifies a full QR table reference as a QR-table flow", () => {
    expect(isQrTableReference("qr_table:order-123")).toBe(true);
  });

  it("classifies a QR split-group reference as a QR-table flow", () => {
    expect(isQrTableReference("qr_table_group:group-456")).toBe(true);
  });

  it("does NOT classify a loan or storefront reference as QR-table", () => {
    expect(isQrTableReference("loan:abc")).toBe(false);
    expect(isQrTableReference("order:o1:mode:single:attempt:a1")).toBe(false);
  });

  it("parses a single-mode storefront checkout reference", () => {
    expect(
      parseCheckoutReference("order:11111111-1111-1111-1111-111111111111:mode:single:attempt:22222222-2222-2222-2222-222222222222"),
    ).toEqual({
      orderId: "11111111-1111-1111-1111-111111111111",
      mode: "single",
      attemptId: "22222222-2222-2222-2222-222222222222",
      splitGroupId: undefined,
    });
  });

  it("parses a partial-mode reference with a split group", () => {
    const parsed = parseCheckoutReference(
      "order:aaaaaaaa-0000-0000-0000-000000000000:mode:partial:attempt:bbbbbbbb-0000-0000-0000-000000000000:split:cccccccc-0000-0000-0000-000000000000",
    );
    expect(parsed?.mode).toBe("partial");
    expect(parsed?.splitGroupId).toBe("cccccccc-0000-0000-0000-000000000000");
  });

  it("returns null for a reference that is not a checkout reference", () => {
    // e.g. a loan or qr_table ref must NOT parse as checkout → webhook routes
    // it elsewhere. Freezing this prevents a regex change from silently
    // swallowing loan/qr payments into the checkout branch.
    expect(parseCheckoutReference("loan:abc")).toBeNull();
    expect(parseCheckoutReference("qr_table:order-123")).toBeNull();
  });
});
