import { describe, it, expect, vi } from "vitest";
import type { SupabaseClient } from "@supabase/supabase-js";

// `@/lib/mercadopago` revienta al importarse sin credenciales, y este test no
// llega a llamar a MP: solo comprueba la guarda que corre antes.
vi.mock("@/lib/mercadopago", () => ({
  preferenceClient: {
    create: async () => ({
      id: "pref-1",
      init_point: "https://mp.example/pref-1",
    }),
  },
}));

import { createFakeSupabase } from "@/test/fakeSupabase";
import { createPaymentIntent } from "@/features/qr/services/tablePaymentService";
import { assertOrderReadyForPayment } from "@/features/qr/services/tableFulfillmentService";
import { createTableMpPreference } from "@/features/qr/services/tableMpPreferenceService";

/**
 * La guarda de "el negocio aún está preparando tu pedido" vivía copiada en tres
 * servicios y aplicaba a todo por igual, así que un ticket de pantalla nacía
 * imposible de cobrar. Estas pruebas fijan el comportamiento por origen en los
 * TRES puntos de cobro: si alguien vuelve a poner la regla plana, salen rojas.
 */

const asClient = (db: ReturnType<typeof createFakeSupabase>) =>
  db as unknown as SupabaseClient;

function seed(source: string | null, fulfillment: string) {
  return createFakeSupabase({
    orders: [
      {
        id: "o1",
        tenant_id: "t1",
        status: "in_progress",
        fulfillment_status: fulfillment,
        source,
        total: 395,
        balance_due: 395,
      },
    ],
    order_split_groups: [],
    payments: [],
  });
}

const NOT_READY = /aún está preparando/;

describe("cobro con el pedido en proceso — createPaymentIntent", () => {
  it("una mesa no puede pagar antes de que le llegue", async () => {
    const result = await createPaymentIntent(asClient(seed("qr_table", "received")), {
      orderId: "o1",
      method: "efectivo",
      fingerprint: null,
    });
    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.error.code).toBe("conflict");
      expect(result.error.message).toMatch(NOT_READY);
    }
  });

  it("un ticket de pantalla SÍ puede pagarse en proceso", async () => {
    const result = await createPaymentIntent(asClient(seed("kiosk", "received")), {
      orderId: "o1",
      method: "efectivo",
      fingerprint: null,
    });
    expect(result.ok).toBe(true);
  });

  it("un ticket de mostrador también", async () => {
    const result = await createPaymentIntent(asClient(seed("staff", "received")), {
      orderId: "o1",
      method: "efectivo",
      fingerprint: null,
    });
    expect(result.ok).toBe(true);
  });

  it("sin origen se mantiene la regla estricta de siempre", async () => {
    const result = await createPaymentIntent(asClient(seed(null, "received")), {
      orderId: "o1",
      method: "efectivo",
      fingerprint: null,
    });
    expect(result.ok).toBe(false);
  });

  it("una mesa lista sigue pagándose igual que antes", async () => {
    const result = await createPaymentIntent(asClient(seed("qr_table", "ready")), {
      orderId: "o1",
      method: "efectivo",
      fingerprint: null,
    });
    expect(result.ok).toBe(true);
  });
});

describe("cobro con el pedido en proceso — assertOrderReadyForPayment", () => {
  it("bloquea la mesa", async () => {
    const error = await assertOrderReadyForPayment(
      asClient(seed("qr_table", "received")),
      "o1",
    );
    expect(error?.code).toBe("conflict");
  });

  it("deja pasar la pantalla", async () => {
    const error = await assertOrderReadyForPayment(
      asClient(seed("kiosk", "received")),
      "o1",
    );
    expect(error).toBeNull();
  });
});

describe("cobro con el pedido en proceso — Mercado Pago", () => {
  it("bloquea la mesa antes de crear la preferencia", async () => {
    const result = await createTableMpPreference(
      asClient(seed("qr_table", "received")),
      {
        orderId: "o1",
        baseUrl: "https://ejemplo.mx",
        qrToken: "tok",
      },
    );
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.error.message).toMatch(NOT_READY);
  });

  it("a la pantalla no la bloquea por estar en proceso", async () => {
    const result = await createTableMpPreference(
      asClient(seed("kiosk", "received")),
      {
        orderId: "o1",
        baseUrl: "https://ejemplo.mx",
        qrToken: "tok",
      },
    );
    // Puede fallar más adelante (no hay credenciales de MP en un test unitario),
    // pero NUNCA por la guarda de preparación.
    if (!result.ok) expect(result.error.message).not.toMatch(NOT_READY);
  });
});
