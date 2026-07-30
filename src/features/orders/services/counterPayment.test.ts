import { describe, it, expect } from "vitest";
import type { SupabaseClient } from "@supabase/supabase-js";

import { createFakeSupabase } from "@/test/fakeSupabase";
import { chargeAtCounter } from "@/features/orders/services/counterPaymentService";

/**
 * Cobrar en el mostrador cuando el cliente y quien atiende actúan sobre el mismo
 * pedido a la vez.
 *
 * El bug que congela: si el cliente ya había escaneado y abierto su pago, el
 * mostrador recibía "Esta cuenta fue dividida. Cada persona debe pagar su parte
 * por separado." y se quedaba sin forma de cobrar un pedido de una sola persona.
 */

const asClient = (db: ReturnType<typeof createFakeSupabase>) =>
  db as unknown as SupabaseClient;

const ORDER = {
  id: "o1",
  tenant_id: "t1",
  status: "in_progress",
  fulfillment_status: "received",
  source: "kiosk",
  total: 470,
  balance_due: 470,
  paid_total: 0,
};

function db({
  groups = [],
  payments = [],
}: {
  groups?: Record<string, unknown>[];
  payments?: Record<string, unknown>[];
} = {}) {
  return createFakeSupabase({
    orders: [{ ...ORDER }],
    order_split_groups: groups,
    payments,
    order_activity_log: [],
    qr_codes: [],
  });
}

describe("chargeAtCounter", () => {
  it("nadie tocó nada: levanta el cobro y lo confirma", async () => {
    const result = await chargeAtCounter(asClient(db()), {
      orderId: "o1",
      method: "efectivo",
      actorUserId: "u1",
    });
    expect(result.ok).toBe(true);
    if (result.ok) expect(result.data.confirmedExisting).toBe(false);
  });

  it("el cliente ya declaró su pago desde el celular: lo CONFIRMA, no crea otro", async () => {
    // Este es el caso del 409: existían grupo y cobro pendiente.
    const fake = db({
      groups: [
        {
          id: "g1",
          order_id: "o1",
          device_id: null,
          label: "Cuenta total",
          total: 470,
          balance_due: 470,
          payment_status: "pending_validation",
        },
      ],
      payments: [
        {
          id: "p1",
          order_id: "o1",
          split_group_id: "g1",
          provider: "manual",
          status: "pending",
          amount: 470,
          created_at: "2026-07-28T16:33:00Z",
        },
      ],
    });

    const result = await chargeAtCounter(asClient(fake), {
      orderId: "o1",
      method: "efectivo",
      actorUserId: "u1",
    });

    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.data.confirmedExisting).toBe(true);
      expect(result.data.paymentId).toBe("p1");
      expect(result.data.amount).toBe(470);
    }
    // No debe haber nacido un segundo cobro.
    const inserted = fake.writes.filter(
      (w) => w.table === "payments" && w.op === "insert",
    );
    expect(inserted).toHaveLength(0);
  });

  it("el cliente abrió el pago y se arrepintió: cobra ESE grupo, no falla", async () => {
    const result = await chargeAtCounter(
      asClient(
        db({
          groups: [
            {
              id: "g1",
              order_id: "o1",
              device_id: null,
              label: "Cuenta total",
              total: 470,
              balance_due: 470,
              payment_status: "pending",
            },
          ],
        }),
      ),
      { orderId: "o1", method: "efectivo", actorUserId: "u1" },
    );
    expect(result.ok).toBe(true);
  });

  it("cuenta repartida de verdad: se niega y dice dónde cobrarla", async () => {
    const result = await chargeAtCounter(
      asClient(
        db({
          groups: [
            { id: "g1", order_id: "o1", device_id: "d1", payment_status: "pending" },
            { id: "g2", order_id: "o1", device_id: "d2", payment_status: "pending" },
          ],
        }),
      ),
      { orderId: "o1", method: "efectivo", actorUserId: "u1" },
    );
    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.error.code).toBe("conflict");
      expect(result.error.message).toMatch(/repartida/);
      expect(result.error.message).toMatch(/Mesas/);
    }
  });

  it("un solo grupo ya pagado: dice que ya está pagado, no revive el cobro", async () => {
    const result = await chargeAtCounter(
      asClient(
        db({
          groups: [
            { id: "g1", order_id: "o1", device_id: null, payment_status: "paid" },
          ],
        }),
      ),
      { orderId: "o1", method: "efectivo", actorUserId: "u1" },
    );
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.error.message).toMatch(/ya está pagado/);
  });

  it("confirmar dos veces no cobra de más", async () => {
    const fake = db({
      groups: [
        {
          id: "g1",
          order_id: "o1",
          device_id: null,
          total: 470,
          balance_due: 470,
          payment_status: "pending_validation",
        },
      ],
      payments: [
        {
          id: "p1",
          order_id: "o1",
          split_group_id: "g1",
          provider: "manual",
          status: "pending",
          amount: 470,
          created_at: "2026-07-28T16:33:00Z",
        },
      ],
    });
    const first = await chargeAtCounter(asClient(fake), {
      orderId: "o1",
      method: "efectivo",
      actorUserId: "u1",
    });
    const second = await chargeAtCounter(asClient(fake), {
      orderId: "o1",
      method: "efectivo",
      actorUserId: "u1",
    });
    expect(first.ok).toBe(true);
    // La segunda no encuentra pendiente y el grupo ya quedó pagado.
    expect(second.ok).toBe(false);
    const inserted = fake.writes.filter(
      (w) => w.table === "payments" && w.op === "insert",
    );
    expect(inserted).toHaveLength(0);
  });
});
