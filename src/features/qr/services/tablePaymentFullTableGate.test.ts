import { describe, expect, it } from "vitest";
import type { SupabaseClient } from "@supabase/supabase-js";

import { createPaymentIntent } from "@/features/qr/services/tablePaymentService";
import { createFakeSupabase } from "@/test/fakeSupabase";

const asClient = (db: ReturnType<typeof createFakeSupabase>) =>
  db as unknown as SupabaseClient;

describe("table full-payment guard", () => {
  it("does not let a ready device create a full-table payment while another person is in progress", async () => {
    const db = createFakeSupabase({
      orders: [
        {
          id: "o1",
          tenant_id: "t1",
          status: "in_progress",
          fulfillment_status: "in_progress",
          source: "qr_table",
          total: 910,
          balance_due: 910,
        },
      ],
      order_devices: [
        {
          id: "d-ready",
          order_id: "o1",
          device_fingerprint: "fp-ready",
          fulfillment_status: "ready",
        },
      ],
      order_split_groups: [],
      payments: [],
    });

    const result = await createPaymentIntent(asClient(db), {
      orderId: "o1",
      method: "efectivo",
      fingerprint: "fp-ready",
    });

    expect(result.ok).toBe(false);
  });
});
